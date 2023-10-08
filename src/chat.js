import { change, getPantry } from "./pantry.js";

import EventEmitter from "events";
import axios from "axios";
import { encode } from "punycode";
import fs from "fs";
import { getEmbeddings } from "./embeddings.js";
import path from "path";

const model = process.env.OPEN_AI_MODEL || "gpt-3.5-turbo";

const prompt = readMarkdownFile(
  path.join(path.resolve(new URL("../", import.meta.url).pathname), "prompt.md")
);

let history = [];

export function clearHistory() {
  history = [];
}
export async function getChatResponse({ message, currentMemory }) {
  const topic = await getTopic(message);

  const usableHistory = history.reverse().reduce(
    (out, h, i) => {
      const { tokens, items } = out;
      const itemTokens = encode(h.content).length;
      if (tokens + itemTokens > 2000) {
        return { tokens, items };
      }
      return { tokens: tokens + itemTokens, items: [h, ...items] };
    },
    { tokens: 0, items: [] }
  );
  console.log(
    `[bot]: using ${usableHistory.tokens} tokens of previous history`
  );
  console.log(
    `[bot]: A question was posed for the ${
      topic === "other" ? "cabin boy" : topic
    }`
  );
  switch (topic) {
    case "mechanic": {
      return getMechanicsAnswer({
        message,
        currentMemory,
        usableHistory,
      });
    }
    case "quartermaster": {
      return getQuartermasterAnswer({ message });
    }
    default: {
      return getGenericAnswer({ message });
    }
  }
}

async function getMechanicsAnswer({ message, currentMemory, usableHistory }) {
  let embeddings;

  try {
    embeddings = await getEmbeddings({ text: message });
  } catch (err) {
    console.error(err);
    res.emit("error", new Error("Failed to get embeddings"));
  }

  let messages = [
    {
      role: "system",
      content: [
        prompt,
        `You have access to the following files: \n${currentMemory
          .map((cm, i) => `${i + 1}. ${cm.name} - ${cm.description}`)
          .join("\n")}`,
      ].join("\n"),
    },
  ];

  let content = [`You are the mechanic. Here is the question: ${message}`];

  if (embeddings.length) {
    content = [
      ...content,
      `Here is some background information related to the next question from the manuals. If it doesn't seem relevant then ignore it:`,
      ...embeddings.reduce(
        (out, e) => [...out, `File name: ${e.sourceUrl}`, `Content: ${e.text}`],
        []
      ),
    ];
  } else {
    content = [
      ...content,
      `Information regarding the question was not found in any of the manuals. You can still try to answer the question, but say that your answer is not based on the manuals.`,
    ];
  }

  content = [...content, `\n\nWhat answer would you give?`];
  messages = [
    ...messages,
    ...usableHistory.items,
    {
      role: "user",
      content: content.join("\n"),
    },
  ];

  let data = {
    userMessage: message,
    model,
    messages,
    max_tokens: 2000,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true,
  };

  return streamResponse(data);
}

async function streamResponse({ userMessage, ...data }) {
  const res = new EventEmitter();
  const apiKey = process.env.OPEN_AI_KEY;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      data,
      {
        headers: {
          accept: "text/event-stream",
          Authorization: `Bearer ${apiKey}`,
        },
        responseType: "stream",
      }
    );
    const stream = response.data;
    let out = "";
    stream.on("data", (chunk) => {
      try {
        const lines = chunk
          .toString()
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((l) => l.replace("data: ", ""));
        for (let line of lines) {
          if (line === "[DONE]") {
            // done
          } else {
            // Parse the chunk as a JSON object
            const data = JSON.parse(line);
            let content = data?.choices[0]?.delta?.content;
            if (content) {
              out += content;
            }
          }
        }
        // Send immediately to allow chunks to be sent as they arrive
      } catch (error) {
        // End the stream but do not send the error, as this is likely the DONE message from createCompletion
        console.error(error);
      }
    });

    // Send the end of the stream on stream end
    stream.once("end", () => {
      console.log(`Generated chat reply`);
      res.emit("data", out);
      res.emit("done");
      history.push(
        { role: "user", content: userMessage },
        { role: "assistant", content: out }
      );
      history = history.slice(-20);
    });

    // If an error is received from the completion stream, send an error message and end the response stream
    stream.on("error", (error) => {
      console.error(error);
      res.emit("error", error);
    });
  } catch (err) {
    console.error(err.response.data);
    res.emit("error", new Error("Failed to get response from OpenAI"));
  }
  return res;
}

function readMarkdownFile(filePath) {
  // Read the file synchronously (you can use asynchronous methods if needed)
  const fileContent = fs.readFileSync(filePath, "utf-8").toString();

  // Remove comments and empty lines
  const filteredContent = fileContent
    .replace(/<!--[\s\S]*?-->/g, "") // Removes HTML comments
    .replace(/\/\/.*/g, "") // Removes single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // Removes multi-line comments
    .replace(/^\s*[\r\n]/gm, ""); // Removes empty lines

  return filteredContent;
}

export async function getTopic(message) {
  let data = {
    model,
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: `Here is a question posed to you from the first-mate or Captain, is this question for the "quartermaster" (Long John) regarding boat stores, the "mechanic" (Kaylee) regarding workings of the boat, or something else? Respond with a single word, either "quartermaster", "mechanic", or "other".
          
          ${message}
          `,
      },
    ],
    max_tokens: 50,
    temperature: 0.1,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };
  return getResponse(data);
}

async function getResponse(data) {
  try {
    const apiKey = process.env.OPEN_AI_KEY;
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      data,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return response?.data?.choices[0]?.message?.content;
  } catch (err) {
    console.error(err?.message);
  }
}

async function getQuartermasterAnswer({ message }) {
  let pantry = await getPantry();
  const items = Object.keys(pantry).join(", ");
  let data = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a pantry robot that controls the stock in the pantry, you read natural language and reply with the changes required in JSON format. These changes will be read by another robot. You only reply with changes, if there are no changes, return an empty array.",
      },
      {
        role: "user",
        content: `Items: ${items}. Add two cans of beans to the pantry and remove 1 carrot.`,
      },
      {
        role: "assistant",
        content: `[{ "item": "beans", "delta": 2 }, { "item": "carrots", "delta": -1 }]`,
      },
      {
        role: "user",
        content: "What's in the pantry?",
      },
      {
        role: "assistant",
        content: `[]`,
      },
      { role: "user", content: `Items: ${items}. ${message}` },
    ],
    max_tokens: 2000,
    temperature: 0.1,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };

  const changesText = await getResponse(data);
  const changes = JSON.parse(changesText);
  const newPantry = await change(changes);

  let question = message;
  if (changes.length) {
    // change the question to just return the new state of the pantry
    question =
      "We just made some changes to the pantry, tell me what is currently in there in a nice list. Put the things we have run out of at the bottom.";
  }

  let data2 = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: `You are the quartermaster. You are being asked a question about the ships stores. If you need to list multiple items, do so as an inventory for easy reading.
Here is the current state of the ships pantry:

${JSON.stringify(newPantry, null, 2)}

Here is the question:

${message}`,
      },
    ],
    max_tokens: 2000,
    temperature: 0.1,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true,
    userMessage: message,
  };

  return await streamResponse(data2);
}

async function getGenericAnswer({ message }) {
  let data2 = {
    model,
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: `You are the cabin boy. You are being asked the question:

${message}`,
      },
    ],
    max_tokens: 2000,
    temperature: 0.1,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true,
    userMessage: message,
  };

  return await streamResponse(data2);
}
