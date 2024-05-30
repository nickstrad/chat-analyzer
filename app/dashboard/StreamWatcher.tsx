"use client";
import { RefreshingAuthProvider } from "@twurple/auth";
import { Bot } from "@twurple/easy-bot";
import { redirect } from "next/navigation";
import React from "react";
import Cookies from "js-cookie";
import { usePrevious } from "@uidotdev/usehooks";
import { useTable } from "react-table";

import { LLMResponse } from "@/utils/entities";
import { runLiveStreamPrompt } from "@/utils/promptHelper";

const DEFAULT_CHANNEL = "plaqueboymax";
const REDIRECT_URL = `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_TWITCH_BOT_CLIENT_ID}&redirect_uri=http://localhost:3000/api/auth_redirect&response_type=code&scope=chat:read`;

export default function StreamWatcher() {
  const [currentChannel, setCurrentChannel] = React.useState(DEFAULT_CHANNEL);
  const prevChannel = usePrevious(currentChannel);
  const [authProvider, setAuthProvider] =
    React.useState<RefreshingAuthProvider>();
  const [msgs, setMsgs] = React.useState<any[]>([]);
  const [totalMsgs, setTotalMsgs] = React.useState(0);
  const [isLoading, setLoading] = React.useState(false);
  const [topicData, setTopicData] = React.useState<LLMResponse[]>([]);

  const makeLLMCall = React.useCallback(
    async (comments: string): Promise<LLMResponse[]> => {
      setLoading(true);
      try {
        const data = await runLiveStreamPrompt(comments);

        const responseData: LLMResponse[] = data.split("\n").map((line) => {
          const [topic, sentimentRating, description] =
            line.split(/,(.*),(.*)/s);

          let normalizdeSentiment = -1;

          try {
            normalizdeSentiment = parseInt(sentimentRating);
          } catch (err) {
            try {
              const tokens = sentimentRating.split(":");
            } catch (err) {
              console.error(err);
            }
          }

          return {
            topic,
            sentimentRating: normalizdeSentiment,
            description,
          };
        });

        setTopicData((prev) => prev.concat(responseData));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
      return [];
    },
    []
  );

  const handleSubmit = (event: any) => {
    event.preventDefault();
    const inputValue = event.target[0].value;
    setCurrentChannel(inputValue);
  };

  React.useEffect(() => {
    if (!msgs.length || msgs.length < 30 || isLoading) {
      return;
    }

    const copy = [...msgs.map((msg) => msg.text)];
    setTotalMsgs(totalMsgs + copy.length);
    setMsgs([]);
    const run = async () => {
      try {
        await makeLLMCall(copy.join("\n"));
      } catch (err) {
        console.error(err);
      }
    };

    run();
  }, [msgs, isLoading]);

  React.useEffect(() => {
    const authData = Cookies.get("twitch_token");

    if (!authData) {
      redirect(REDIRECT_URL);
    }

    if (authProvider) {
      return;
    }

    const run = async () => {
      const provider = new RefreshingAuthProvider({
        clientId: process.env.NEXT_PUBLIC_TWITCH_BOT_CLIENT_ID!,
        clientSecret: process.env.NEXT_PUBLIC_TWITCH_BOT_CLIENT_SECRET!,
      });

      provider.onRefresh(async (userId, newTokenData) =>
        Cookies.set("twitch_token", btoa(JSON.stringify(newTokenData)))
      );

      const data = JSON.parse(authData);
      await provider.addUserForToken(data, ["chat"]);
      setAuthProvider(provider);
    };

    run();
  }, [authProvider]);

  React.useEffect(() => {
    if (!currentChannel || currentChannel === prevChannel || !authProvider) {
      return;
    }

    const newBot = new Bot({
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
  }, [currentChannel, prevChannel, authProvider]);

  return (
    <main>
      <form onSubmit={handleSubmit}>
        <div>
          {" "}
          <input type="text" />
        </div>
        <div>
          <button>set channel</button>
        </div>
      </form>
      <h1>Current Channel:</h1>
      <h2> {currentChannel}</h2>

      <div className="stats stats-vertical lg:stats-horizontal shadow">
        <div className="stat">
          <div className="stat-title">Total Messages</div>
          <div className="stat-value">{totalMsgs}</div>
          <div className="stat-desc">
            Total amount of messages analyzed in stream
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Next Batch</div>
          <div className="stat-value">
            <progress className="progress w-56" value={msgs.length} max="30" />
          </div>
          <div className="stat-desc">
            Time until next batch of messages is analyzed
          </div>
        </div>
      </div>

      <Table data={topicData} />
    </main>
  );
}

export const COLUMNS = [
  {
    Header: "Topic",
    accessor: "topic",
  },
  {
    Header: "Sentiment Rating",
    accessor: "sentimentRating",
  },
  {
    Header: "Description",
    accessor: "description",
  },
];

const Table = ({ data }: { data: any[] }): JSX.Element => {
  const columns = React.useMemo(() => COLUMNS, []);
  const {
    getTableProps, // table props from react-table
    getTableBodyProps, // table body props from react-table
    headerGroups, // headerGroups, if your table has groupings
    rows, // rows for the table based on the data passed
    prepareRow, // Prepare the row (this function needs to be called for each row before getting the row props)
  } = useTable({
    columns,
    data,
  });

  return (
    <>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell, idx) => {
                  return (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};
