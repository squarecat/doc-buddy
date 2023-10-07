import { getChatResponse, getTopic } from "../src/chat.js";

import { savePantry } from "../src/pantry.js";

const questions = [
  "Hey, how many tins of beans do we have left?",
  "When do we need to change the oil?",
  "How many oil filters do we need?",
  "Do I need to get more butter today?",
  "What breed of dolphins are there in the med?",
];
async function go() {
  for (let q of questions) {
    console.log(q);
    console.log(await getTopic(q));
  }
}

export async function start() {
  // let pantry = await savePantry({
  //   beans: 2,
  //   carrots: 4,
  // });
  // console.log("Start:");
  // console.log(JSON.stringify(pantry, null, 2));
  // const out = await getChatResponse({
  //   message: "Add four bags of cofeee to the pantry and 1 carrot.",
  // });
  // out.on("data", (data) => console.log(data));

  // const out2 = await getChatResponse({
  //   message: "How many bags of coffee are there?",
  // });
  // out2.on("data", (data) => console.log(data));

  // const out3 = await getChatResponse({
  //   message: "Do we have enough beans?",
  // });
  // out3.on("data", (data) => console.log(data));

  // const out4 = await getChatResponse({
  //   message: "What's currently in the stores?",
  // });
  // out4.on("data", (data) => console.log(data));

  const out5 = await getChatResponse({
    message: "What breed of dolphins are there in the med?",
  });
  out5.on("data", (data) => console.log(data));
  // console.log(out);
}
