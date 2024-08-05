"use client";
import React from "react";
import { StaticAuthProvider } from "@twurple/auth";
import { Bot } from "@twurple/easy-bot";
import {
  DequeueItemsParams,
  EnqueueItemsParams,
  Item,
  Question,
  QueueMap,
  QueueObject,
  Topic,
  User,
  View,
} from "@/utils";
import { User as NextUser } from "next-auth";
import { QuestionsTable, QueueTable, TopicsTable } from "@/components/Tables";
import { IoSettingsSharp } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { BsQuestionSquareFill } from "react-icons/bs";
import { HiQueueList } from "react-icons/hi2";
import { RiBrainFill } from "react-icons/ri";
import { QueueView } from "@/components/Queue";
import _ from "lodash-es";

export default function StreamWatcher({
  user,
  token,
}: {
  user: NextUser;
  token?: string;
}) {
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [queueMap, setQueueMap] = React.useState<QueueObject>({});
  const [queueViewKey, setQueueViewKey] = React.useState("");

  const [batchSize, setBatchSize] = React.useState(
    process.env.NEXT_PUBLIC_DEFAULT_BATCH_SIZE
      ? parseInt(process.env.NEXT_PUBLIC_DEFAULT_BATCH_SIZE)
      : 100
  );
  const [isConnected, setIsConnected] = React.useState(false);
  const [currentChannel, setCurrentChannel] = React.useState(
    process.env.NEXT_PUBLIC_DEFAULT_CHANNEL ?? ""
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [msgs, setMsgs] = React.useState<any[]>([]);
  const [view, setView] = React.useState<View>("TOPICS");
  const [error, setError] = React.useState("");
  const [bot, setBot] = React.useState<Bot>();

  const handleDequeueItem = React.useCallback(
    async (
      itemIds: Pick<DequeueItemsParams, "itemIds">
    ): Promise<(Topic | Question)[] | undefined> => {
      if (!user?.name) {
        console.error("user's id is not set");
        return;
      }
      if (!queueViewKey) {
        console.error("'queueViewKey' id is not set");
      }
      try {
        setIsLoading(true);
        setError("");

        console.log({ itemIds });
        const resp = await fetch(`/api/queues`, {
          method: "DELETE",
          body: JSON.stringify({
            username: user.name,
            itemIds,
            queueKey: queueViewKey,
          }),
        });

        const data = await resp.json();
        if (data.error) {
          setError(data.error);
        } else {
          setQueueMap(data);
        }
      } catch (error) {
        let message = "Unknown Error";
        if (error instanceof Error) message = error.message;
        // we'll proceed, but let's report it
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.name]
  );

  const handleEnqueueItem = React.useCallback(
    async ({
      items = [],
    }: Pick<EnqueueItemsParams, "items">): Promise<void> => {
      if ((!questions.length && !topics.length) || !queueViewKey) {
        console.error(
          "Must pass a list of questions or topics and have a valid queue key "
        );
      }

      if (!user?.name) {
        console.error("user's id is not set");
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        console.log({
          username: user.name,
          queueKey: queueViewKey,
          items,
        });
        const resp = await fetch(`/api/queues`, {
          method: "PATCH",
          body: JSON.stringify({
            username: user.name,
            queueKey: queueViewKey,
            items,
          }),
        });

        const data = await resp.json();
        if (data.error) {
          setError(data.error);
        } else {
          setQueueMap(data);
        }
      } catch (error) {
        let message = "Unknown Error";
        if (error instanceof Error) message = error.message;
        // we'll proceed, but let's report it
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [user.name, queueViewKey, questions, topics]
  );

  /**
   * LLM Call Related functions
   */
  const handleMakeLLMCall = React.useCallback(
    async (comments: string): Promise<Topic[]> => {
      try {
        setIsLoading(true);
        setError("");
        const resp = await fetch("/api/model-response", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(comments),
        });
        const data = await resp.json();
        if (data.error) {
          setError(data.error);
        } else {
          return data;
        }
      } catch (error) {
        let message = "Unknown Error";
        if (error instanceof Error) message = error.message;
        // we'll proceed, but let's report it
        setError(message);
      } finally {
        setIsLoading(false);
      }
      return [];
    },
    []
  );

  React.useEffect(() => {
    if (!msgs.length || msgs.length < batchSize || isLoading || !queueViewKey) {
      return;
    }

    console.log("handle message buffer");

    let copy = [...msgs];

    setMsgs([]);

    /*

    header
    group px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider

    row
    px-6 py-4 whitespace-nowrap
    */
    const run = async () => {
      const newQuestions: Question[] = copy
        .filter((sentence) => sentence.text.trim().endsWith("?"))
        .map((sentence) => ({
          user: sentence.userDisplayName,
          question: sentence.text,
        }));

      const questionMap = newQuestions.reduce((acc, cur) => {
        const key = `${cur.user}${cur.question.trim()}`;
        if (!acc.has(key)) {
          acc.set(key, cur);
        }
        return acc;
      }, new Map());

      const questionSet: Question[] = [];
      questionMap.forEach((value: Question, key: string, map) => {
        if (!value.question.split("").every((c) => c === "?")) {
          questionSet.push(value);
        }
      });
      if (questionSet.length) {
        setQuestions(questions.concat(questionSet));
      }

      const commentsText = copy.map((c) => c.text).join("\n");
      const newTopics = await handleMakeLLMCall(commentsText);

      if (newTopics?.length) {
        setTopics(topics.concat(newTopics));
      }
    };
    run();
  }, [msgs, isLoading, batchSize]);

  React.useEffect(() => {
    console.log({ queueViewKey, queueMap });
  }, [queueViewKey, queueMap]);
  const configureUserData = React.useCallback(async () => {
    if (!user?.name) {
      setError("Unable to get user from session.");
      return;
    }

    try {
      setIsLoading(true);

      const resp = await fetch(`/api/users`, {
        method: "POST",
        body: JSON.stringify({ username: user?.name, email: user?.email }),
      });

      const userInfo = await resp.json();

      if (!userInfo) {
        console.error("unable to save or get user's information");
      } else {
        const {
          queueMap: newQueueMap,
          currentQueueKey: newCurrentQueueKey = "default",
        } = userInfo;
        console.log({ newQueueMap, newCurrentQueueKey });

        setQueueMap(newQueueMap);
        setQueueViewKey(newCurrentQueueKey);
      }
    } catch (error) {
      let message = "Unknown Error";
      if (error instanceof Error) message = error.message;
      // we'll proceed, but let's report it
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    configureUserData();
  }, [configureUserData]);

  React.useEffect(() => {
    if (
      !user?.name ||
      !token ||
      !currentChannel ||
      isConnected ||
      isLoading ||
      bot
    ) {
      return;
    }

    try {
      setIsLoading(true);
      const authProvider = new StaticAuthProvider(user.name, token);
      let newBot: Bot | undefined = new Bot({
        authProvider,
        channels: [currentChannel],
      });

      newBot.onMessage((msg) => {
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
      });

      newBot.onConnect(() => {
        setIsConnected(true);
      });

      newBot.onJoin((ev) => {
        console.log("onJoin");
        console.log(ev);

        setIsConnected(true);
      });
      newBot.onLeave((ev) => {
        console.log("onLeave");
        console.log(ev);
        // setIsConnected(true);
      });
      setBot(newBot);
    } catch (error) {
      let message = "Unknown Error";
      if (error instanceof Error) message = error.message;
      // we'll proceed, but let's report it
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, token, currentChannel, bot]);

  const handleUpdateSettings = React.useCallback(
    (ev: any) => {
      ev.preventDefault();

      const {
        currentChannel: { value: newCurrentChannel },
        batchSize: { value: newBatchSize },
        queueViewKey: { value: newQueueViewKey },
      } = ev.target.elements;
      if (newBatchSize !== batchSize) {
        setBatchSize(newBatchSize);
      }

      if (newCurrentChannel && newCurrentChannel !== currentChannel) {
        if (bot && currentChannel) {
          bot.leave(currentChannel);
          bot.join(newCurrentChannel);
        }
        setCurrentChannel(newCurrentChannel);
      }
      if (newQueueViewKey && newQueueViewKey !== queueViewKey) {
      }
    },
    [batchSize, currentChannel, bot]
  );

  const handleSettingsChange = React.useCallback(
    (ev: any) => {
      ev.preventDefault();

      const { value, name } = ev.target;
      if (name === "batchSize") {
        setBatchSize(value);
      }

      if (name === "currentChannel") {
        setCurrentChannel(value);
      }

      if (name === "queueViewKey") {
        setQueueViewKey(value);
      }
    },
    [batchSize, currentChannel, bot]
  );

  return (
    <div className="flex w-full">
      <div className="flex-start pr-2 ">
        <div className="h-dvh justify-start flex flex-col w-inherit h-inherit border-white w-full border-r-2 bg-primary">
          <ul className="menu w-full">
            <li className="pb2" onClick={() => setView("SETTINGS")}>
              <a>
                <IoSettingsSharp />
                Settings
              </a>
            </li>
            <li className="pb2" onClick={() => setView("TOPICS")}>
              <a>
                <RiBrainFill />
                Topics
              </a>
            </li>
            <li className="pb2" onClick={() => setView("QUESTIONS")}>
              <a>
                <BsQuestionSquareFill />
                Questions
              </a>
            </li>
            <p>Queues</p>
            {Object.keys(queueMap).map((key, idx) => (
              <li
                key={`${key}-${idx}`}
                className="pb2"
                onClick={() => {
                  setQueueViewKey(key);
                  setView("QUEUE");
                }}
              >
                <a>
                  <HiQueueList />
                  {key}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col w-full">
        <div className="flex w-full justify-between">
          <div className="prose lg:prose-xl">
            <h1>
              {view === "QUEUE" ? `${queueViewKey} Queue` : null}
              {view === "TOPICS" ? "Topics" : null}
              {view === "QUESTIONS" ? `Questions` : null}
              {view === "SETTINGS" ? `Settings` : null}
            </h1>
          </div>
          <div>
            {error ? (
              <div className="flex-grow">
                <div className="divider divider-horizontal" />
                <div className="toast">
                  <IoClose onClick={() => setError("")} />
                  <div className="alert alert-info">
                    <span>{error}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div>
            {msgs.length}/{batchSize ?? 0}
          </div>
          <div className="pl-4 py-4">
            <div className="flex-grow indicator">
              <span
                className={`indicator-item indicator-start badge ${
                  isConnected ? "badge-success" : "badge-error"
                }`}
              />
              <div>
                <div className="p-2">
                  {isConnected ? (
                    <>
                      Connected to <h2>{`${currentChannel}'s`}</h2> live chat
                    </>
                  ) : (
                    <>Not Connected</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {view === "SETTINGS" ? (
          <form onSubmit={handleUpdateSettings}>
            <div className="form-control mt-8 p-8 mt-4 shadow border-b border-gray-200">
              <div className="join join-vertical">
                <label className="label">
                  <span className="label-text">Comment Batch Size</span>
                </label>
                <label className="input-group input-group-vertical">
                  <span>Size</span>
                  <input
                    value={batchSize}
                    onChange={handleSettingsChange}
                    placeholder={`${batchSize}`}
                    type="number"
                    name="batchSize"
                  />
                </label>
                <label className="label">
                  <span className="label-text">Current Channel</span>
                </label>
                <label className="input-group input-group-vertical">
                  <span>Channel</span>
                  <input
                    value={currentChannel}
                    onChange={handleSettingsChange}
                    placeholder={currentChannel ?? ""}
                    type="text"
                    name="currentChannel"
                  />
                </label>
                <label className="input-group input-group-vertical">
                  <span>Queue Key</span>
                  <input
                    value={queueViewKey}
                    onChange={handleSettingsChange}
                    placeholder={queueViewKey ?? ""}
                    type="text"
                    name="queueViewKey"
                  />
                </label>
              </div>
              <button>Update</button>
            </div>
          </form>
        ) : null}

        {view === "TOPICS" ? (
          <TopicsTable
            handleDelete={(topic: Item): void => {
              setTopics(
                topics.filter(
                  (t) =>
                    !(
                      t.longSummary === topic.longSummary &&
                      t.shortSummary === topic.shortSummary &&
                      t.sentimentRating === topic.sentimentRating
                    )
                )
              );
            }}
            data={topics}
            handleEnqueueItem={handleEnqueueItem}
            view={view}
          />
        ) : null}

        {view === "QUESTIONS" ? (
          <QuestionsTable
            handleDelete={(question: Item): void => {
              setQuestions(
                questions.filter(
                  (q) =>
                    !(
                      q.user === question.user &&
                      q.question === question.question
                    )
                )
              );
            }}
            data={questions}
            view={view}
            handleEnqueueItem={handleEnqueueItem}
          />
        ) : null}

        {view === "QUEUE" ? (
          <QueueTable
            dequeItem={handleDequeueItem}
            //@ts-check
            queue={queueViewKey in queueMap ? queueMap[queueViewKey] : []}
          />
        ) : null}

        {/* <h2>topics json</h2>
      {JSON.stringify(topics)}
      <h2>questions json</h2>
      {JSON.stringify(questions)} */}
      </div>
    </div>
    //{" "}
  );
}
