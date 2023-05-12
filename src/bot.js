import {
  getMemoryIndex,
  saveMemoryIndex,
  uploadFileToStorage,
} from "./storage.js";

import { Telegraf } from "telegraf";
import axios from "axios";
import dotenv from "dotenv";
import { getChatResponse } from "./chat.js";
import { saveEmbeddingsFile } from "./embeddings.js";

let currentMemory;
let currentFile = null;
dotenv.config({});

export const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const { telegram } = bot;

bot.hears("hi", (ctx) => ctx.reply("Hey there"));

const onMessage = async (ctx) => {
  const document = ctx.message.document;
  if (document) {
    const fileId = document.file_id;
    const fileUrl = await telegram.getFileLink(fileId);
    console.log(`[bot]: Received document: ${document.file_name} (${fileUrl})`);
    ctx.reply(`Wait a moment while I take a look at that...`);
    const fileResponse = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(fileResponse.data, "binary");

    await saveEmbeddingsFile({
      file: { raw: buffer, name: document.file_name },
    });
    await uploadFileToStorage({
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
    saveMemoryIndex(currentMemory);
  } else {
    const typingAnimation = setInterval(() => {
      ctx.replyWithChatAction("typing");
    }, 2000);
    const chatEmitter = await getChatResponse({
      message: ctx.message.text,
      currentMemory,
    });
    chatEmitter.on("data", (d) => ctx.reply(d));
    chatEmitter.on("error", (d) =>
      ctx.reply(`I had some trouble with that: ${d.message}`)
    );
    chatEmitter.on("done", () => clearInterval(typingAnimation));
  }
};

bot.on("text", onMessage);
bot.on("message", onMessage);
bot.command("forget", (ctx) => {
  ctx.reply(
    "Okay, lets stop the current conversation and talk about something else."
  );
});

bot.catch((err, ctx) => {
  console.log(`Error: ${err.stack}`);
  ctx.reply(`I had some trouble with that: ${err.message}`);
});

export async function launch() {
  currentMemory = await getMemoryIndex();
  console.log(JSON.stringify(currentMemory, null, 2));
  bot.launch();
}

export async function memory() {
  return currentMemory;
}
