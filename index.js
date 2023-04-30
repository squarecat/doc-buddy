import Koa from "koa";
import dotenv from "dotenv";

dotenv.config({});

const { launch } = await import("./src/bot.js");
launch();
console.log("Bot listening...");

const app = new Koa();
app.listen(process.env.PORT);
