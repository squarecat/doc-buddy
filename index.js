import { Telegraf } from "telegraf";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import { getChatResponse } from "./src/chat.js";
import { saveEmbeddingsFile } from "./src/embeddings.js";

let currentMemory = JSON.parse(fs.readFileSync("memory.json").toString());
let currentFile = null;
dotenv.config({});

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const { telegram } = bot;

bot.hears("hi", (ctx) => ctx.reply("Hey there"));
bot.on("message", async (ctx) => {
  // Handle the message update here
  const document = ctx.message.document;
  if (document) {
    const fileId = document.file_id;
    const fileUrl = await telegram.getFileLink(fileId);
    console.log(`Received document: ${document.file_name} (${fileUrl})`);

    const fileResponse = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(fileResponse.data, "binary");
    await saveEmbeddingsFile({
      file: { raw: buffer, name: document.file_name },
    });
    currentFile = document.file_name;
    ctx.reply(
      `Can you give me a short description of what that file is about?`
    );
  } else if (currentFile) {
    const description = ctx.message.text;
    currentMemory = [...currentMemory, { name: currentFile, description }];
    ctx.reply(`Okay, I've learned the info from ${currentFile}`);
    currentFile = null;
    fs.writeFileSync("memory.json", JSON.stringify(currentMemory, null, 2));
  } else {
    const chatEmitter = await getChatResponse({
      message: ctx.message.text,
      currentMemory,
    });
    chatEmitter.on("data", (d) => ctx.reply(d));
    chatEmitter.on("error", (d) =>
      ctx.reply(`I had some trouble with that: ${d.message}`)
    );
  }
});

bot.catch((err, ctx) => {
  console.log(`Error: ${err}`);
  ctx.reply(`I had some trouble with that: ${err.message}`);
});

bot.launch();
