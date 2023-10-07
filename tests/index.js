import dotenv from "dotenv";
dotenv.config({});

const { start } = await import("./prompts.js");

start();
