### Chat-analyzer

Chat-analyzer is an early prototype for a web application that allows a user to connect to a twitch stream. After connecting
to the stream, incoming chat messages are aggregated and sent into a LLM for insights into what is being discussed in the chat.

These insights can help inform a live stream about the topics their live chat is discussing, the sentitments about the topic, and a more detailed
description of the topic to give context.

### Development

#### Env file

1. Create `.env.local` file
2. Add these values to the file.

```
NEXT_PUBLIC_TWITCH_REDIRECT_URL=http://localhost:3000/api/auth_redirect
NEXT_PUBLIC_TWITCH_CLIENT_SCOPES=chat:read
NEXT_LLM_API_BASE_PATH="http://localhost:1234"
NEXT_LLM_API_KEY=...
NEXT_LLM_MODEL_NAME="gpt-3.5-turbo"
NEXTAUTH_SECRET=...
TWITCH_CLIENT_SECRET=...
TWITCH_CLIENT_ID=...
```

Fill in missing env variables using these links:

- [twitch values](https://twurple.js.org/docs/examples/chat/basic-bot.html)
- Run `npx auth secret` and use value in `NEXTAUTH_SECRET`
- If using live LLM OpenAI API compliant endpoint, override `NEXT_LLM_*` values with correct values

#### Setup Environment

1. install https://lmstudio.ai/
   a. Download LLM in LMStudio. Some examples are: - [microsoft Phi 3](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf) - [Llama 4 8B](https://huggingface.co/MaziyarPanahi/Llama-3-8B-Instruct-32k-v0.1-GGUF)
   b. [OPTIONAL] Use live LLM endpoint like OpenAI
2. Run `npm i` in root directory of cloned repo

#### Local Dev Flow

1. Run `npm run dev`
2. If using LMStudio, start the model server and update `.env.local` file to have this value `NEXT_LLM_API_BASE_PATH="http://localhost:1234"`
