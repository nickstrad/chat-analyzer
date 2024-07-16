import { OpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { StructuredOutputParser } from "langchain/output_parsers";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { Topic, LLM_TOPICS_ARRAY_ZOD_SCHEMA } from "@/utils";

export async function runLiveStreamPrompt(data: string): Promise<Topic[]> {
  // if (!process.env.NEXT_LLM_API_KEY) {
  //   throw "env variable NEXT_LLM_API_KEY needs to be set";
  // }

  // const model = new OpenAI(
  //   {
  //     openAIApiKey: process.env.NEXT_LLM_API_KEY ?? "not-needed",
  //     temperature: 0,
  //     model: process.env.NEXT_LLM_MODEL_NAME,
  //     streaming: false,
  //   },
  //   { baseURL: process.env.NEXT_LLM_API_BASE_PATH }
  // );

  const model = new ChatAnthropic(
    {
      apiKey: process.env.NEXT_LLM_API_KEY ?? "not-needed",
      temperature: 0,
      model: process.env.NEXT_LLM_MODEL_NAME,
      streaming: false,
    }
    // { baseURL: process.env.NEXT_LLM_API_BASE_PATH }
  );

  const outputParser = StructuredOutputParser.fromZodSchema(
    LLM_TOPICS_ARRAY_ZOD_SCHEMA
  );

  const chatPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      await PromptTemplate.fromTemplate(
        `
        You are a chatroom participant who analyzes a live stream chats 
        incoming messages. As you analyze the messages you summarize 
        them and select up to 5 of the most passionate topics. You ignore spam.

        \`\`\`{{format_instructions}}\`\`\`
        `
      ).format({
        format_instructions: outputParser.getFormatInstructions(),
      }),
    ],
    [
      "human",
      await PromptTemplate.fromTemplate(
        `Analyze the live stream comments delimited by the triple
          backticks for the most discussed topics.

          \`\`\`{{chat_comments}}\`\`\``
      ).format({
        chat_comments: data,
      }),
    ],
  ]);

  const chain = RunnableSequence.from([chatPrompt, model, outputParser]);
  const topics = await chain.invoke({
    format_instructions: outputParser.getFormatInstructions(),
    chat_comments: data,
  });

  //@ts-ignore
  return topics as Topic[];
}
