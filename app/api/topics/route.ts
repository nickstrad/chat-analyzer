import { getServerSession } from "next-auth/next";
import {
  AddTopicParams,
  connectDB,
  getTopicListsByKey,
  getTopicListsMap,
  updateTopicListsMap,
} from "@/utils";
import { authOptions } from "../auth/[...nextauth]/route";

const CHECK_API_SESSION = /true/i.test(process.env.API_TESTING ?? "");

export async function GET(request: Request) {
  if (CHECK_API_SESSION) {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  if (!username) {
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  const topicListMapKey = searchParams.get("topicListMapKey");

  try {
    await connectDB();
    if (topicListMapKey) {
      return Response.json(
        await getTopicListsByKey({ username, topicListMapKey })
      );
    }

    return Response.json(await getTopicListsMap(username));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (CHECK_API_SESSION) {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }
  }

  const {
    username = "",
    topics = [],
    topicListMapKey = "",
  }: AddTopicParams = await request.json();

  if (!username) {
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  if (!topicListMapKey) {
    Response;
    return Response.json(
      { error: "'topicListKey' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  try {
    await connectDB();
    return Response.json(
      await updateTopicListsMap({
        username,
        topics,
        topicListMapKey,
      })
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}
