import { DeleteObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";

const s3Client = new S3({
  endpoint: process.env.STORAGE_URL,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.STORAGE_KEY,
    secretAccessKey: process.env.STORAGE_SECRET,
  },
});

export async function getMemoryIndex() {
  const file = await getFileFromStorage({ path: "memory.json" });
  const memory = JSON.parse(file);
  return memory;
}

export async function saveMemoryIndex(memoryJson) {
  const rawFile = Buffer.from(JSON.stringify(memoryJson), "binary");
  const params = {
    Bucket: process.env.STORAGE_NAME,
    Key: "memory.json",
    Body: rawFile,
    ContentType: "application/json",
    ACL: "public-read",
  };
  const command = new PutObjectCommand(params);
  try {
    await s3Client.send(command);
    console.log("[file]: saved memory");

    return {
      bucket: process.env.STORAGE_NAME,
      key: "memory.json",
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function getFileFromStorage({ path }) {
  try {
    const output = await s3Client.getObject({
      Bucket: process.env.STORAGE_NAME,
      Key: path,
    });
    console.log("[file]: got file from bucket", path);
    const data = await output.Body.transformToString();

    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function saveJSONFileToStorage({ path, json }) {
  const rawFile = Buffer.from(JSON.stringify(json), "binary");
  const params = {
    Bucket: process.env.STORAGE_NAME,
    Key: path,
    Body: rawFile,
    ContentType: "application/json",
    ACL: "public-read",
  };
  const command = new PutObjectCommand(params);
  try {
    await s3Client.send(command);
    console.log("[file]: saved memory");

    return {
      bucket: process.env.STORAGE_NAME,
      key: path,
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function uploadFileToStorage({ file }) {
  const { raw, name } = file;

  const key = `memory/${name}`;

  const params = {
    Bucket: process.env.STORAGE_NAME,
    Key: key,
    Body: raw,
    ACL: "public-read",
  };
  const command = new PutObjectCommand(params);
  try {
    await s3Client.send(command);
    console.log("[file]: uploaded embeddings file to bucket", key);

    return {
      bucket: process.env.STORAGE_NAME,
      key,
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function deleteFile({ bucket, key }) {
  const deleteParams = {
    Bucket: bucket,
    Key: key,
  };
  try {
    const deleteCommand = new DeleteObjectCommand(deleteParams);
    await s3Client.send(deleteCommand);
    console.log("[file]: deleted embeddings file from bucket", key);
  } catch (err) {
    console.error(err);
    throw err;
  }
}
