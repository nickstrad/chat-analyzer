"use client";
import React, { ChangeEventHandler } from "react";
import { StaticAuthProvider } from "@twurple/auth";
import { Bot } from "@twurple/easy-bot";
import { User } from "next-auth";
import { Table } from "@/components/Table";
import { useLLMHelper } from "@/utils/hook";
import { CiSettings } from "react-icons/ci";

export default function StreamWatcher({
  user,
  token,
}: {
  user?: User;
  token?: string;
}) {
  const [batchSize, setBatchSize] = React.useState(100);
  const [isConnected, setIsConnected] = React.useState(false);
  const [currentChannel, setCurrentChannel] = React.useState(user?.name || "");
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
    if (!user?.name) {
      return;
    }
    const getUserData = async () => {
      try {
        const data = await fetch(`/api/user?username=${user.name}`);
        console.log(data);
      } catch (err) {
        console.log(err);
      }
    };
    getUserData();
  }, []);

  React.useEffect(() => {
    if (
      !user ||
      !user?.id ||
      !user?.name ||
      !token ||
      !currentChannel ||
      isConnected
    ) {
      return;
    }
    setIsConnected(false);
    const authProvider = new StaticAuthProvider(user.id, token);
    const bot = new Bot({
      authProvider,
      channels: [currentChannel],
    });

    bot.onMessage((msg) => {
      appendMessageEvent(msg);
    });
    bot.onConnect(() => {
      setIsConnected(true);
    });
  }, [user, isConnected, token, currentChannel]);

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
                    value={currentChannel}
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
        {Math.floor((msgs.length / batchSize) * 100)}
      </div>

      <Table data={topicData} handleDelete={deleteEvent} />
    </main>
  );
}
