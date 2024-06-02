"use client";
import React, { ChangeEventHandler } from "react";
import { StaticAuthProvider } from "@twurple/auth";
import { Bot } from "@twurple/easy-bot";
import { User } from "next-auth";
import { Table } from "@/components/Table";
import { useLLMHelper } from "@/utils/hook";

export default function StreamWatcher({
  user,
  token,
}: {
  user?: User;
  token?: string;
}) {
  const [batchSize, setBatchSize] = React.useState(100);
  const [isConnected, setIsConnected] = React.useState(false);
  const [msgs, isLoading, topicData, appendMessageEvent] =
    useLLMHelper(batchSize);
  const handleBatchSizeChange: ChangeEventHandler<HTMLInputElement> = (ev) => {
    try {
      setBatchSize(parseInt(ev.target.value));
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (!user || !user?.id || !user?.name || !token || isConnected) {
      return;
    }
    setIsConnected(false);
    const authProvider = new StaticAuthProvider(user.id, token);
    const bot = new Bot({
      authProvider,
      channels: [user.name!],
    });

    bot.onMessage((msg) => {
      appendMessageEvent(msg);
    });
    bot.onConnect(() => {
      setIsConnected(true);
    });
  }, [user, isConnected, token]);

  return (
    <main>
      <h2>
        {isConnected
          ? `Connected ${user?.name ? `as ${user.name}` : ""}`
          : "Not Connected"}
      </h2>
      <div>
        <label htmlFor="batchSizeInput">Comment Batch Size</label>
        <input
          id="batchSizeInput"
          value={batchSize}
          type="number"
          onChange={handleBatchSizeChange}
        />
      </div>

      <div className="stats stats-vertical lg:stats-horizontal shadow">
        <h2>Message Data</h2>
        <div className="stat">
          <div className="stat-desc">
            Total amount of messages analyzed in stream
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">
            Next Batch( {`${msgs.length}/${batchSize}`})
          </div>
          <div className="stat-value">
            <progress
              className="progress w-56"
              value={msgs.length}
              max={batchSize}
            />
          </div>
        </div>
      </div>

      <div>
        <h2>Topic Data</h2>
        <Table data={topicData} />
      </div>
    </main>
  );
}
