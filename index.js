import Koa from "koa";
import dotenv from "dotenv";
import router from "@koa/router";

dotenv.config({});
const { launch } = await import("./src/bot.js");
const app = new Koa();

const statusRouter = router().get("/", (ctx) => {
  let out = {
    _version: 0.1,
  };
  ctx.body = out;
});

app.use(statusRouter.routes());
app.listen(process.env.PORT || 1333);
console.log(`[server]: started on ${process.env.PORT || 1333}`);

launch();
console.log("[server]: Bot listening...");
