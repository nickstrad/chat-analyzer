"use client";
import React, { ChangeEventHandler } from "react";
import { StaticAuthProvider } from "@twurple/auth";
import { Bot } from "@twurple/easy-bot";
import {
  deleteQuestions,
  DequeueItemsParams,
  EnqueueItemsParams,
  Question,
  Queue,
  Topic,
  User,
  View,
} from "@/utils";
import { User as NextUser } from "next-auth";
import { QuestionsTable, TopicsTable } from "@/components/Tables";
import { CiSettings } from "react-icons/ci";
import { IoClose } from "react-icons/io5";
import { QueueView } from "@/components/Queue";

const createUserIfNew = async ({
  username = "",
  email = "",
}: {
  username?: string | null;
  email?: string | null;
}): Promise<User> => {
  if (!username) {
    console.error("Session doesn't have 'name'");
    //TODO: surface this error
  }
  const resp = await fetch(`/api/user`, {
    method: "POST",
    body: JSON.stringify({ username, email }),
  });

  return await resp.json();
};

// const DEFAULT_TOPICS = [
//   {
//     _id: "acddg123",
//     longSummary: "long one",
//     shortSummary: "short one",
//     sentimentRating: 100,
//   } as any,
// ];

// const DEFAULT_QUESTIONS = [
//   { _id: "abd123", question: "bruhhh?", user: "the one" } as any,
// ];

export default function StreamWatcher({
  user,
  token,
}: {
  user: NextUser;
  token?: string;
}) {
  const [topicsKey, setTopicsKey] = React.useState(
    process.env.NEXT_PUBLIC_DEFAULT_KEY ?? "test"
  );
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [questionsKey, setQuestionsKey] = React.useState(
    process.env.NEXT_PUBLIC_DEFAULT_KEY ?? "test"
  );
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [queue, setQueue] = React.useState<Queue>({
    questions: [],
    topics: [],
  } as Queue);
  const [batchSize, setBatchSize] = React.useState(
    process.env.NEXT_PUBLIC_DEFAULT_BATCH_SIZE
      ? parseInt(process.env.NEXT_PUBLIC_DEFAULT_BATCH_SIZE)
      : 100
  );
  const [isConnected, setIsConnected] = React.useState(false);
  const [currentChannel, setCurrentChannel] = React.useState(
    process.env.NEXT_PUBLIC_DEFAULT_CHANNEL || user?.name
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [msgs, setMsgs] = React.useState<any[]>([]);
  const [view, setView] = React.useState<View>("TOPICS");
  const [error, setError] = React.useState("");

  const handleDeleteTopic = React.useCallback(
    async (topicId: string): Promise<Topic[] | undefined> => {
      if (!user?.id) {
        console.error("user's id is not set");
        return;
      }
      try {
        setIsLoading(true);
        setError("");

        const resp = await fetch(`/api/topics`, {
          method: "DELETE",
          body: JSON.stringify({
            username: user.id,
            topicIds: [topicId],
            topicsKey,
          }),
        });

        const data = await resp.json();
        if (data.error) {
          setError(data.error);
        } else {
          setTopics(data);
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
    [user?.id]
  );

  const handleDeleteQuestion = React.useCallback(
    async (question: string): Promise<string[] | undefined> => {
      if (!user?.id) {
        console.error("user's id is not set");
        return;
      }
      try {
        setIsLoading(true);
        setError("");

        const resp = await fetch(`/api/questions`, {
          method: "DELETE",
          body: JSON.stringify({
            username: user.id,
            questions: [question],
            questionsKey,
          }),
        });

        const data = await resp.json();
        if (data.error) {
          setError(data.error);
        } else {
          setQuestions(data);
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
    [user?.id]
  );

  const handleDequeueItem = React.useCallback(
    async ({
      topicIds,
      questionIds,
    }: Pick<DequeueItemsParams, "topicIds" | "questionIds">): Promise<
      (Topic | Question)[] | undefined
    > => {
      if (!user?.id) {
        console.error("user's id is not set");
        return;
      }
      try {
        setIsLoading(true);
        setError("");

        const resp = await fetch(`/api/queue`, {
          method: "DELETE",
          body: JSON.stringify({
            username: user.id,
            topicIds,
            questionIds,
          }),
        });

        const data = await resp.json();
        if (data.error) {
          setError(data.error);
        } else {
          setQueue(data);
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
    [user?.id]
  );

  const handleSaveTopics = React.useCallback(
    async (topics: Topic[]): Promise<Topic[] | undefined> => {
      if (!user?.id) {
        console.error("user's id is not set");
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const resp = await fetch(`/api/topics`, {
          method: "PATCH",
          body: JSON.stringify({ username: user.id, topics, topicsKey }),
        });

        const data = await resp.json();
        if (data.error) {
          setError(data.error);
        } else {
          setTopics(data);
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
    []
  );

  const handleEnqueueItem = React.useCallback(
    async ({
      questions = [],
      topics = [],
    }: Pick<EnqueueItemsParams, "questions" | "topics">): Promise<void> => {
      if (!questions.length && !topics.length) {
        console.error("Must pass a list of questions or topics ");
      }

      if (!user?.id) {
        console.error("user's id is not set");
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const resp = await fetch(`/api/queue`, {
          method: "PATCH",
          body: JSON.stringify({
            username: user.id,
            topics,
            questions,
          }),
        });

        const data = await resp.json();
        if (data.error) {
          setError(data.error);
        } else {
          setQueue(data);
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
    [user.id]
  );

  const handleSaveQuestions = React.useCallback(
    async (questions: Question[]): Promise<Topic[] | undefined> => {
      if (!user?.id) {
        console.error("user's id is not set");
        return;
      }
      try {
        setIsLoading(true);
        setError("");
        const resp = await fetch(`/api/questions`, {
          method: "PATCH",
          body: JSON.stringify({ username: user.id, questions, questionsKey }),
        });

        const data = await resp.json();
        if (data.error) {
          setError(data.error);
        } else {
          setQuestions(data);
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
    [user.id]
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
    if (!msgs.length || msgs.length < batchSize || isLoading) {
      return;
    }

    let copy = [...msgs];

    setMsgs([]);

    const questionMap = copy.reduce((acc, cur) => {
      if (!acc.has(cur.text)) {
        acc.set(cur.text, cur);
      }

      return acc;
    }, new Map<string, Question>());

    copy = [...questionMap.keys()].map((key) => questionMap.get(key));
    const run = async () => {
      const questions: Question[] = copy
        .filter((sentence) => sentence.text.trim().endsWith("?"))
        .map((sentence) => ({
          user: sentence.userDisplayName,
          question: sentence.text,
        }));

      if (questions.length) {
        await handleSaveQuestions(questions);
      }

      const commentsText = copy.map((c) => c.text).join("\n");
      const newTopics = await handleMakeLLMCall(commentsText);

      if (newTopics?.length) {
        await handleSaveTopics(newTopics);
      }
    };
    run();
  }, [msgs, isLoading, batchSize]);

  const handleBatchSizeChange: ChangeEventHandler<HTMLInputElement> = (ev) => {
    try {
      setBatchSize(parseInt(ev.target.value));
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuestionsKeyChange: ChangeEventHandler<HTMLInputElement> = (
    ev
  ) => {
    try {
      setQuestionsKey(ev.target.value);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTopicsKeyChange: ChangeEventHandler<HTMLInputElement> = (ev) => {
    try {
      setTopicsKey(ev.target.value);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    const run = async () => {
      const userInfo = await createUserIfNew({
        username: user?.id,
        email: user?.email,
      });

      if (!userInfo) {
        console.error("unable to save or get user's informatino");
      }
    };
    run();
  }, []);

  React.useEffect(() => {
    if (!user?.id || !token || !currentChannel || isConnected) {
      return;
    }
    setIsConnected(false);
    const authProvider = new StaticAuthProvider(user.id, token);
    const bot = new Bot({
      authProvider,
      channels: [currentChannel],
    });

    bot.onMessage((msg) => {
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

    bot.onConnect(() => {
      setIsConnected(true);
    });
  }, [isConnected, token, currentChannel]);

  // React.useEffect(() => {
  //   console.log("questions");
  //   console.log(questions.length);
  //   console.log(questions);
  // }, [questions]);

  // React.useEffect(() => {
  //   console.log("topics");
  //   console.log(topics.length);
  //   console.log(topics);
  // }, [topics]);
  return (
    <main>
      {isConnected ? (
        <>
          <span className="indicator-item badge badge-secondary">{}</span>
          <p>
            Connected {currentChannel ? `to ${currentChannel}'s live chat` : ""}
          </p>
        </>
      ) : (
        <>
          <span className="indicator-item badge badge-secondary">{}</span>
          <p>Not Connected</p>
        </>
      )}

      <div className="drawer">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content">
          {/* Page content here */}
          <label htmlFor="my-drawer" className="btn btn-primary drawer-button">
            <span className="text-xl">
              <CiSettings />{" "}
            </span>
            Manage Stream Settings
          </label>
        </div>
        <div className="drawer-side">
          <label
            htmlFor="my-drawer"
            aria-label="close sidebar"
            className="drawer-overlay"
          />
          <ul className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
            {/* Sidebar content here */}
            <div className="form-control mt-8 p-8 mt-4 shadow border-b border-gray-200">
              <div className="join join-vertical">
                <label className="label">
                  <span className="label-text">Set Questions Key</span>
                </label>
                <label className="input-group input-group-vertical">
                  <span>Questions Key</span>
                  <input
                    id="questionsKey"
                    value={questionsKey}
                    type="text"
                    onChange={handleQuestionsKeyChange}
                  />
                </label>
                <label className="label">
                  <span className="label-text">Set Topics Key</span>
                </label>
                <label className="input-group input-group-vertical">
                  <span>Topics Key</span>
                  <input
                    id="topicsKey"
                    value={topicsKey}
                    type="text"
                    onChange={handleTopicsKeyChange}
                  />
                </label>
                <label className="label">
                  <span className="label-text">Comment Batch Size</span>
                </label>
                <label className="input-group input-group-vertical">
                  <span>Size</span>
                  <input
                    id="batchSizeInput"
                    value={batchSize}
                    type="number"
                    onChange={handleBatchSizeChange}
                  />
                </label>
                <label className="label">
                  <span className="label-text">Current Channel</span>
                </label>
                <label className="input-group input-group-vertical">
                  <span>Channel</span>
                  <input
                    id="channelInput"
                    value={currentChannel || ""}
                    type="text"
                    onChange={(ev) => {
                      setCurrentChannel(ev.target.value);
                    }}
                  />
                </label>
              </div>
            </div>
          </ul>
        </div>
      </div>

      <div
        className="radial-progress"
        //@ts-ignore
        style={{ "--value": Math.floor((msgs.length / batchSize) * 100) }}
        role="progressbar"
      >
        {Math.floor((msgs.length / batchSize) * 100)}%
      </div>

      <div className="join">
        <button
          className="btn join-item"
          type="button"
          onClick={() => setView("TOPICS")}
        >
          Topics
        </button>
        <button className="btn join-item" onClick={() => setView("QUESTIONS")}>
          Questions
        </button>
        <button className="btn join-item" onClick={() => setView("QUEUE")}>
          Queue
        </button>
      </div>
      {view === "TOPICS" ? (
        <TopicsTable
          handleDelete={async (id: string): Promise<void> => {
            await handleDeleteTopic(id);
          }}
          data={topics}
          handleEnqueueItem={handleEnqueueItem}
          view={view}
        />
      ) : null}
      {view === "QUESTIONS" ? (
        <QuestionsTable
          handleDelete={async (id: string): Promise<void> => {
            await handleDeleteQuestion(id);
          }}
          data={questions}
          view={view}
          handleEnqueueItem={handleEnqueueItem}
        />
      ) : null}
      {view === "QUEUE" ? (
        <QueueView
          dequeueItem={handleDequeueItem}
          topics={queue.topics}
          questions={queue.questions}
        />
      ) : null}
      {error ? (
        <div className="toast">
          <IoClose onClick={() => setError("")} />
          <div className="alert alert-info">
            <span>{error}</span>
          </div>
        </div>
      ) : null}
      {/* <h2>topics json</h2>
      {JSON.stringify(topics)}
      <h2>questions json</h2>
      {JSON.stringify(questions)} */}
    </main>
  );
}
