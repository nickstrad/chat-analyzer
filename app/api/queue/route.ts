import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import {
  connectDB,
  dequeueItems,
  DequeueItemsParams,
  enqueueItems,
  EnqueueItemsParams,
  getQueue,
} from "@/utils";

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

  try {
    await connectDB();
    return Response.json(await getQueue(username));
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
    questions = [],
  }: EnqueueItemsParams = await request.json();

  if (!username) {
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  try {
    await connectDB();
    return Response.json(
      await enqueueItems({
        username,
        topics,
        questions,
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
    questionIds = [],
    topicIds = [],
  }: DequeueItemsParams = await request.json();

  if (!username) {
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  if (!questionIds.length && !topicIds.length) {
    return Response.json(
      { error: "'itemIds' and `questionIds` cannot both be empty" },
      {
        status: 400,
      }
    );
  }

  try {
    await connectDB();
    return Response.json(
      await dequeueItems({
        username,
        questionIds,
        topicIds,
      })
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}
