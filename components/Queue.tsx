"use client";
import React from "react";

import { DequeueItemsParams, Question, Topic, View } from "@/utils";

interface QueueItemId {
  _id: string;
}
type ExtendedTopic = Topic & QueueItemId;
type ExtendedQuestion = Question & QueueItemId;
interface Props {
  topics: Partial<ExtendedTopic>[];
  questions: Partial<ExtendedQuestion>[];
  dequeueItem: (
    props: Pick<DequeueItemsParams, "topicIds" | "questionIds">
  ) => void;
}
export const QueueView = ({
  topics,
  questions,
  dequeueItem,
}: Props): JSX.Element => {
  const [view, setView] = React.useState<View>("TOPICS");
  return (
    <>
      <div className="join">
        <button
          className="btn join-item"
          type="button"
          onClick={() => setView("TOPICS")}
        >
          Queued Topics
        </button>
        <button className="btn join-item" onClick={() => setView("QUESTIONS")}>
          Queued Questions
        </button>
      </div>

      {view === "TOPICS" ? (
        <ul>
          {topics.map((t) => (
            <li key={t._id}>
              <TopicItem
                topic={t}
                dequeue={async () => {
                  await dequeueItem({
                    topicIds: t?._id ? [t._id] : [],
                    questionIds: [],
                  });
                }}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {view === "QUESTIONS" ? (
        <ul>
          {questions.map((q) => (
            <li key={q._id}>
              <QuestionItem
                question={q}
                dequeue={async () => {
                  await dequeueItem({
                    questionIds: q?._id ? [q._id] : [],
                    topicIds: [],
                  });
                }}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
};

interface TopicItemProps {
  topic: Partial<ExtendedTopic>;
  dequeue: () => void;
}

const TopicItem = ({ topic, dequeue }: TopicItemProps): JSX.Element => {
  return (
    <div
      onClick={async () => {
        await dequeue();
      }}
    >
      Topic:{JSON.stringify(topic)}
    </div>
  );
};

interface QuestionItemProps {
  question: Partial<ExtendedQuestion>;
  dequeue: () => void;
}
const QuestionItem = ({
  question,
  dequeue,
}: QuestionItemProps): JSX.Element => {
  return (
    <div
      onClick={async () => {
        await dequeue();
      }}
    >
      Question:{JSON.stringify(question)}
    </div>
  );
};
