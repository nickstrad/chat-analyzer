import {
  APIAction,
  connectDB,
  dequeueItems,
  DequeueItemsParams,
  enqueueItems,
  EnqueueItemsParams,
  getQueue,
  getQueueMap,
} from "@/utils";
import { validateUserAgainstSession } from "@/utils/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const queueKey = searchParams.get("queueKey");
  if (!username) {
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  try {
    if (!validateUserAgainstSession(username)) {
      return Response.json(
        { error: `cannot make call for ${username}` },
        {
          status: 403,
        }
      );
    }

    await connectDB();
    if (queueKey) {
      return Response.json(await getQueue({ username, queueKey }));
    }

    return Response.json(await getQueueMap(username));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const {
    username = "",
    items = [],
    queueKey = "",
  }: EnqueueItemsParams = await request.json();

  if (!username) {
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  if (!items.length) {
    return Response.json(
      { error: "'items' list cannot be empty" },
      {
        status: 400,
      }
    );
  }

  if (!queueKey) {
    return Response.json(
      { error: "'queueKey' list cannot be empty" },
      {
        status: 400,
      }
    );
  }

  try {
    if (!validateUserAgainstSession(username)) {
      return Response.json(
        { error: `cannot make call for ${username}` },
        {
          status: 403,
        }
      );
    }

    await connectDB();
    return Response.json(
      await enqueueItems({
        username,
        items,
        queueKey,
      })
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const {
    username = "",
    itemIds = [],
    queueKey = "",
  }: DequeueItemsParams = await request.json();

  if (!username) {
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  if (!queueKey) {
    return Response.json(
      { error: "'queueKey' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  if (!itemIds.length) {
    return Response.json(
      { error: "'items' list cannot be empty" },
      {
        status: 400,
      }
    );
  }

  try {
    if (!validateUserAgainstSession(username)) {
      return Response.json(
        { error: `cannot make call for ${username}` },
        {
          status: 403,
        }
      );
    }
    await connectDB();
    return Response.json(
      await dequeueItems({
        username,
        queueKey,
        itemIds,
      })
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}
