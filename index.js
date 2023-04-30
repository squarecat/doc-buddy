import dotenv from "dotenv";
dotenv.config({});

const { launch } = await import("./src/bot.js");
launch();
console.log("Bot listening...");
