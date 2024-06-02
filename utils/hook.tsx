import React from "react";
import { LLMResponse } from "./entities";

const DEFAULT_TOPIC_DATA: LLMResponse[] = [
  {
    topic: "glorpers",
    sentimentRating: 500,
    description: "Discussion about real glorpers and their knowledge",
  },
  {
    topic: "cronch",
    sentimentRating: 300,
    description: "Repetitive mentions of cronch",
  },
  {
    topic: "plink",
    sentimentRating: 400,
    description: "Repetitive use of plink in the chat",
  },
  {
    topic: "capy MewSpin",
    sentimentRating: 400,
    description: "	Repeated reference to capy MewSpin",
  },
  {
    topic: "landing",
    sentimentRating: 600,
    description: "Excitement about finally landing",
  },
];
export const useLLMHelper = (
  batchSize: number
): [any[], boolean, LLMResponse[], (msg: any) => void] => {
  const [isLoading, setLoading] = React.useState(false);
  const [msgs, setMsgs] = React.useState<any[]>([]);
  const [topicData, setTopicData] = React.useState<LLMResponse[]>([
    ...DEFAULT_TOPIC_DATA,
    ...DEFAULT_TOPIC_DATA,
    ...DEFAULT_TOPIC_DATA,
  ]);

  const handleLLMCall = React.useCallback(
    async (comments: string): Promise<LLMResponse[]> => {
      setLoading(true);
      try {
        const resp = await fetch("/api/model-response", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(comments),
        });
        const { data } = await resp.json();
        return data;
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
      return [];
    },
    []
  );

  React.useEffect(() => {
    if (!msgs.length || msgs.length < batchSize || isLoading) {
      return;
    }

    const copy = [...msgs.map((msg) => msg.text)];
    setMsgs([]);
    const run = async () => {
      try {
        const data = await handleLLMCall(copy.join("\n"));
        setTopicData((prev) => prev.concat(data));
      } catch (err) {
        console.error(err);
      }
    };

    run();
  }, [msgs, isLoading, batchSize]);

  const appendMessageEvent = (msg: any) => {
    setMsgs((prev) =>
      prev.concat([
        {
          userId: msg.userId,
          userName: msg.userName,
          userDisplayName: msg.userDisplayName,
          broadcasterId: msg.broadcasterId,
          broadcasterName: msg.broadcasterName,
          text: msg.text,
        },
      ])
    );
  };

  return [msgs, isLoading, topicData, appendMessageEvent];
};
