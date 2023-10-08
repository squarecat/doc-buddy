import { getFileFromStorage, saveJSONFileToStorage } from "./storage.js";

export async function getPantry() {
  const pJson = await getFileFromStorage({ path: "pantry.json" });
  const pantry = JSON.parse(pJson);
  const sortedKeys = Object.keys(pantry).sort();
  const sortedObj = {};
  for (let key of sortedKeys) {
    sortedObj[key] = obj[key];
  }
  return sortedObj;
}

export async function savePantry(json) {
  await saveJSONFileToStorage({ path: "pantry.json", json });
  return await getPantry();
}

export async function change(things) {
  const pantry = await getPantry();
  if (things.length === 0) {
    return pantry;
  }
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
