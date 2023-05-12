import FormData from "form-data";
import axios from "axios";

export async function saveEmbeddingsFile({ file }) {
  const embeddingsUrl = process.env.EMBEDDINGS_URL;
  const embeddingsKey = process.env.BEARER_TOKEN;

  console.log(`Embedding file ${file.name} to ${embeddingsUrl}/upsert-file`);
  try {
    const formData = new FormData();
    formData.append("file", file.raw, { filename: file.name }); // append the file to the FormData object
    formData.append(
      "metadata",
      JSON.stringify({
        url: file.name,
        source: "file",
        created_at: new Date(),
      })
    );

    const response = await axios.post(
      `${embeddingsUrl}/upsert-file`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${embeddingsKey}`,
          "content-type": "multipart/form-data",
          ...formData.getHeaders(),
        },
      },
      {
        timeout: 300000, // 5 minutes
      }
    );
    const { ids } = response.data;
    return { ids };
  } catch (err) {
    console.error(
      err.stack ||
        err?.response?.data ||
        "Something went wrong saving embeddings"
    );
    throw new Error("Failed to save embeddings");
  }
}

export async function getEmbeddings({ text }) {
  const embeddingsUrl = process.env.EMBEDDINGS_URL;
  const embeddingsKey = process.env.EMBEDDINGS_BEARER_TOKEN;
  try {
    const response = await axios.post(
      `${embeddingsUrl}/query`,
      {
        queries: [
          {
            query: text,
            top_k: 3,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${embeddingsKey}`,
          "content-type": "application/json",
        },
      }
    );
    const { results } = response.data.results[0] || [];
    console.log(JSON.stringify(results, null, 2));
    return results
      .filter((r) => r.score > 0.8)
      .map((r) => {
        const hasType = r.metadata.url.match(/\.[0-9a-z]+$/i);
        const type = hasType ? hasType[0] : "website";
        const isFile = [".pdf", ".txt", ".docx", ".pptx", ".md"].includes(type);
        return {
          text: r.text,
          sourceUrl: r.metadata.url,
          type: isFile ? "file" : "website",
        };
      });
  } catch (err) {
    console.error(
      err.stack ||
        err?.response?.data ||
        "Something went wrong fetching embeddings"
    );
    return [];
  }
}

export function combineSummaries(summaries) {
  return summaries.reduce((out, s) => {
    // if this source has already been included
    let existing = out.find((e) => e.source === s.sourceUrl);

    if (existing) {
      const output = {
        ...existing,
        text: `${existing.text}\n${s.text}`,
      };
      return [...out.filter((o) => o.source !== existing.source), output];
    } else {
      let t;
      if (s.type === "website") {
        t = "markdown";
      } else {
        t = s.sourceUrl.match(/\.[0-9a-z]+$/i)[0];
      }
      let output = {
        text: s.text,
        type: t,
        source: s.sourceUrl,
      };

      return [...out, output];
    }
  }, []);
}
