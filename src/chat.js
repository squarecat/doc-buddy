import EventEmitter from "events";
import axios from "axios";
import { encode } from "punycode";
import { getEmbeddings } from "./embeddings.js";

const prompt = [
  `You are a member of the crew on a small sailboat (a Beneteau Oceanis 361) named Nayru.`,
  `- Your role is record keeper, and you need to know everything about the boat's workings.`,
  `- You only have the capability to read the manuals, not do any other tasks.`,
  `- Answer questions politely, in the manner of an old-sea-dog speaking to the captain.`,
  `- Refer to the captain as "Captain".`,
  `- Always translate measurements to metric.`,
  `- Nayru's engine is a Yanmar 3YM30E`,
];
let history = [];

export async function getChatResponse({ message, currentMemory }) {
  const res = new EventEmitter();
  let embeddings;
  try {
    embeddings = await getEmbeddings({ text: message });
  } catch (err) {
    console.error(err);
    res.emit("error", new Error("Failed to get embeddings"));
  }

  const apiKey = process.env.OPEN_AI_KEY;
  let messages = [
    {
      role: "system",
      content: [
        ...prompt,
        `You have access to the following files: \n${currentMemory
          .map((cm, i) => `${i + 1}. ${cm.name} - ${cm.description}`)
          .join("\n")}`,
      ].join("\n"),
    },
  ];

  let content = [`Here is the question from the Captain: ${message}`];

  if (embeddings.length) {
    content = [
      ...content,
      `Here is some background information related to the next question from Nayru's manuals:`,
      ...embeddings.reduce(
        (out, e) => [...out, `File name: ${e.sourceUrl}`, `Content: ${e.text}`],
        []
      ),
    ];
  }

  const usableHistory = history.reverse().reduce(
    (out, h, i) => {
      const { tokens, items } = out;
      const itemTokens = encode(h.content).length;
      if (tokens + itemTokens > 2000) {
        return { tokens, hist };
      }
      return { tokens: tokens + itemTokens, items: [h, ...items] };
    },
    { tokens: 0, items: [] }
  );
  console.log(
    `[bot]: using ${usableHistory.tokens} tokens of previous history`
  );

  content = [...content, `\n\nWhat answer would you give the Captain?`];
  messages = [
    ...messages,
    ...usableHistory.items,
    {
      role: "user",
      content: content.join("\n"),
    },
  ];

  console.log(JSON.stringify(messages, null, 2));

  let data = {
    model: "gpt-3.5-turbo",
    messages,
    max_tokens: 500,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true,
  };
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
    let outputTokenLength = 0;
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
              console.log(content);
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
      history.push(
        { role: "user", content: content.join("\n") },
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
