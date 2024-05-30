import { AzureChatOpenAI } from "@langchain/openai";
import {
  CommaSeparatedListOutputParser,
  StructuredOutputParser,
} from "langchain/output_parsers";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { LLMResponse } from "./entities";

export async function runLiveStreamPrompt(data: string): Promise<string> {
  if (!process.env.NEXT_PUBLIC_OPENAI_API_BASE_PATH) {
    throw "env variable NEXT_PUBLIC_OPENAI_API_BASE_PATH needs to be set";
  }

  const chat = new AzureChatOpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
    temperature: 0,
    model: "gpt-3.5-turbo",
    openAIBasePath: process.env.NEXT_PUBLIC_OPENAI_API_BASE_PATH,
  });
  const outputParser = new CommaSeparatedListOutputParser();
  const systemTemplate = PromptTemplate.fromTemplate(
    `
    You are a chatroom participant who analyzes a live stream chats 
    incoming messages. As you analyze the messages you summarize 
    the messages into the most passiontately discussed topics. You 
    list the topics  with 3 to 7 word descriptions, a  
    number indicating the positive sentiment rating between 0 to 1000, and 
    a 10 to 20 word summary of the topic.
    {format_instructions}`
  );

  const humanTemplate = PromptTemplate.fromTemplate(
    `Analyze the live stream comments delimited by the triple
      backticks for the most discussed topics
      \`\`\`{chat_comments}\`\`\``
  );

  const chatPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      await systemTemplate.format({
        format_instructions: outputParser.getFormatInstructions(),
      }),
    ],
    [
      "human",
      await humanTemplate.format({
        chat_comments: data,
      }),
    ],
  ]);

  const chain = RunnableSequence.from([chatPrompt, chat, outputParser]);
  const content = await chain.invoke({});
  // console.log(content);
  // console.log(content.join(","));
  return content.join(",");
}
