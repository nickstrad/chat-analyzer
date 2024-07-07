"use client";
import React, { ChangeEventHandler } from "react";
import { StaticAuthProvider } from "@twurple/auth";
import { Bot } from "@twurple/easy-bot";
import { User } from "@/utils";
import { User as NextUser } from "next-auth";
import { Table } from "@/components/Table";
import { useLLMHelper } from "@/utils";
import { CiSettings } from "react-icons/ci";

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

  const { data } = await resp.json();
  return data;
};

export default function StreamWatcher({
  user,
  token,
}: {
  user?: NextUser;
  token?: string;
}) {
  const [username, setUsername] = React.useState<string>("");
  const [userId, setUserId] = React.useState<string>("");
  const [batchSize, setBatchSize] = React.useState(100);
  const [isConnected, setIsConnected] = React.useState(false);
  const [currentChannel, setCurrentChannel] = React.useState(
    process.env.NEXT_PUBLIC_DEFAULT_CHANNEL || user?.name
  );
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
    const run = async () => {
      const userInfo = await createUserIfNew({
        username: user?.name,
        email: user?.email,
      });

      if (userInfo && user?.id) {
        setUsername(userInfo.username);
        setUserId(user.id);
      }
    };
    run();
  }, []);

  React.useEffect(() => {
    if (!userId || !username || !token || !currentChannel || isConnected) {
      return;
    }
    setIsConnected(false);
    const authProvider = new StaticAuthProvider(userId, token);
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
  }, [username, userId, isConnected, token, currentChannel]);

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
        {Math.floor((msgs.length / batchSize) * 100)}
      </div>

      <Table data={topicData} handleDelete={deleteEvent} />
    </main>
  );
}
