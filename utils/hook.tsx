import React from "react";
import { Topic } from "./mongoDbHelpers";

export const useLLMHelper = (
  batchSize: number
): [any[], boolean, Topic[], (msg: any) => void, (uid: string) => void] => {
  const [isLoading, setLoading] = React.useState(false);
  const [msgs, setMsgs] = React.useState<any[]>([]);
  const [topicData, setTopicData] = React.useState<Topic[]>([]);

  const handleLLMCall = React.useCallback(
    async (comments: string): Promise<Topic[]> => {
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

  const deleteTopic = (uid: string) => {
    const newData = [...topicData].filter((t) => t.uid !== uid);
    setTopicData(newData);
  };
  return [msgs, isLoading, topicData, appendMessageEvent, deleteTopic];
};
