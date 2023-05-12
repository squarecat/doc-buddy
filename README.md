# Documentation Buddy

## Getting Started

Documentation Buddy is a chatbot powered by GPT-4 and OpenAI.

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

## Uploading documentation

Simply upload a doc to the Telegram chat and doc buddy will learn the contents of that document.

[![Example file upload](./imgs/upload-file.png)]

## Customizing the assistant

You can edit the prompt that is given to the assistant in the `prompt.md` file.
