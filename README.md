# Documentation Buddy

## Getting Started

Documentation Buddy is a Telegram chatbot powered by GPT and OpenAI. You can upload PDF and other documents, the bot will learn from them and you can ask it questions.

Useful in a variety of situations where you have too much information to learn and need a quick reference guide!

### Requirements

- Your own OpenAI account and API Key
- A Pinecone account and API Key (for embeddings)
- Somewhere s3-like to save files (for re-indexing if needed)
- A Telegram key from BotFather

### Optional Requirements:

- A DigitalOcean account if you want to deploy directly to DigitalOceans App Platform. If you don't already have one, you can sign up at https://cloud.digitalocean.com/registrations/new.

## Deploying the App

Click this button to deploy the app to the DigitalOcean App Platform. If you are not logged in, you will be prompted to log in with your DigitalOcean account.

[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/squarecat/doc-buddy/tree/main)

## Environment Variables

You'll need to add these to the DigitalOcean app env variables.

| Key | Default | Description   |
| ------------- | ------------- |
| OPEN_AI_MODEL  | "gpt-3.5-turbo" | The AI model that the assistant will use to reply. GPT-3.5-Turbo will be good enough for most cases |
| OPEN_AI_KEY  | | |
| TELEGRAM_TOKEN | | The token you get from BotFather | 
| EMBEDDINGS_BEARER_TOKEN  |   | |
| STORAGE_NAME  | | |
| STORAGE_URL  |  | |
| STORAGE_KEY |  | |
| STORAGE_SECRET  | | |
| DATASTORE | pinecone  | |
| PINECONE_API_KEY  |  | |
| PINECONE_ENVIRONMENT | | |
| PINECONE_INDEX | | |

## Usage - uploading documentation

Simply upload a doc to the Telegram chat and doc buddy will learn the contents of that document.

![Example file upload](./imgs/upload-file.png)

## Customizing the assistant

You can edit the prompt that is given to the assistant in the `prompt.md` file.

## Sponsor

Sponsored by [Ellie - Your AI Email assistant](https://tryellie.com). Ellie learns from your writing style and crafts replies as if they were written by you! 

[![Ellie example](./imgs/ellie.png)](https://tryellie.com?ref=doc-buddy)
