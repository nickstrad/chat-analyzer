import { AzureChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "langchain/output_parsers";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import ShortUniqueId from "short-unique-id";
import { Topic, LLM_TOPICS_ARRAY_ZOD_SCHEMA } from "@/utils";

const { randomUUID } = new ShortUniqueId({ length: 10 });

const extendLLMTopicData = (response: Topic): Topic => ({
  ...response,
  uid: randomUUID(),
});

export async function runLiveStreamPrompt(data: string): Promise<Topic[]> {
  if (!process.env.NEXT_LLM_API_BASE_PATH) {
    throw "env variable NEXT_OPENAI_API_BASE_PATH needs to be set";
  }

  const model = new AzureChatOpenAI({
    apiKey: process.env.NEXT_LLM_API_KEY,
    temperature: 0,
    model: process.env.NEXT_LLM_MODEL_NAME,
    openAIBasePath: process.env.NEXT_LLM_API_BASE_PATH,
  });

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

  return (topics as Topic[]).map(extendLLMTopicData);
}
