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
  const [msgs, isLoading, topicData, appendMessageEvent, deleteEvent] =
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
      <div className="indicator">
        {isConnected ? (
          <>
            <span className="indicator-item badge badge-secondary">{}</span>
            <p>Connected {user?.name ? `to ${user.name}'s live chat` : ""}</p>
          </>
        ) : (
          <>
            <span className="indicator-item badge badge-secondary">{}</span>
            <p>Not Connected</p>
          </>
        )}
      </div>

      <div className="grid h-20 card rounded-box">
        <label className="input input-bordered flex items-center gap-2">
          Comment Batch Size
          <input
            className="grow"
            id="batchSizeInput"
            value={batchSize}
            type="number"
            onChange={handleBatchSizeChange}
          />
        </label>
      </div>

      <Table data={topicData} handleDelete={deleteEvent} />
    </main>
  );
}
