import { getFileFromStorage, saveJSONFileToStorage } from "./storage.js";

export async function getPantry() {
  const pJson = await getFileFromStorage({ path: "pantry.json" });
  const pantry = JSON.parse(pJson);
  return pantry;
}

export async function savePantry(json) {
  await saveJSONFileToStorage({ path: "pantry.json", json });
  return await getPantry();
}

export async function change(things) {
  const pantry = await getPantry();
  let newPantry = pantry;
  for (let thing of things) {
    const { item, delta } = thing;
    newPantry[item] = (newPantry[item] || 0) + delta;
  }
  console.log("Saving new pantry:");
  console.log(JSON.stringify(newPantry, null, 2));

  await savePantry(newPantry);
  return newPantry;
}
