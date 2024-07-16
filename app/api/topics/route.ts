import { getServerSession } from "next-auth/next";
import {
  AddTopicParams,
  connectDB,
  DeleteTopicParams,
  getTopicsForKey,
  getTopics,
  updateTopics,
  deleteTopics,
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

  const topicsKey = searchParams.get("topicsKey");

  try {
    await connectDB();
    if (topicsKey) {
      return Response.json(await getTopicsForKey({ username, topicsKey }));
    }

    return Response.json(await getTopics(username));
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
    topicsKey = "",
  }: AddTopicParams = await request.json();

  if (!username) {
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  if (!topicsKey) {
    Response;
    return Response.json(
      { error: "'topicsKey' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  try {
    await connectDB();
    return Response.json(
      await updateTopics({
        username,
        topics,
        topicsKey,
      })
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (CHECK_API_SESSION) {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }
  }

  const {
    username = "",
    topicIds = [],
    topicsKey = "",
  }: DeleteTopicParams = await request.json();

  if (!username) {
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  if (!topicIds.length) {
    return Response.json(
      { error: "'topicId' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  if (!topicsKey) {
    Response;
    return Response.json(
      { error: "'topicsKey' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  try {
    await connectDB();
    return Response.json(
      await deleteTopics({
        username,
        topicIds,
        topicsKey,
      })
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}
