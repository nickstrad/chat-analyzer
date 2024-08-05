import mongoose, { mongo } from "mongoose";
import {
  APIRouteResponse,
  DequeueItemsParams,
  EnqueueItemsParams,
  Item,
  Queue,
  QueueMap,
  Topic,
  User,
  UserModel,
} from "@/utils";

//@ts-ignore
export let cached = global.mongoose;

if (!cached) {
  //@ts-ignore
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(process.env.MONGODB_ENDPOINT!, opts)
      .then((mongoose) => {
        return mongoose;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
};

/***************
 * User Helpers
 ***************/
export const createUser = async (
  user: Partial<User>
): Promise<APIRouteResponse> => {
  const { username, ...update } = user;
  if (!username) {
    return { error: "'username' must be set on new User" };
  }

  const newUser = await UserModel.findOneAndUpdate({ username }, user, {
    new: true,
    upsert: true,
  });

  return newUser;
};

export const updateUser = async ({
  username,
  ...update
}: User): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: "'username' must be set" };
  }

  if (Object.keys(update).length < 1) {
    return {
      error: `No properties passed in to update for user '${username}'`,
    };
  }

  let user = await UserModel.findOneAndUpdate({ username }, update, {
    new: true,
  });

  if (!user) {
    return {
      error: `User '${username}' does not exist`,
    };
  }

  return user;
};

export const getUser = async (username: string): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  return user;
};

export const deleteUser = async (
  username: string
): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  const user = await UserModel.findOneAndDelete({ username });

  return !!user;
};

/****************
 * Queue Helpers
 ****************/

export const dequeueItems = async ({
  itemIds = [],
  queueKey,
  username,
}: DequeueItemsParams): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!itemIds.length) {
    return { error: `''itemIds' cannot be empty` };
  }

  if (!queueKey) {
    return { error: `'queueKey' cannot be empty` };
  }

  const user = await UserModel.findOne({ username });
  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  if (!user.queueMap.has(queueKey)) {
    return {
      error: `User '${username}' does not have a list of topics and questions with the ${queueKey} key.`,
    };
  }
  console.log(user);
  console.log("deleting items");
  const items = user.queueMap.get(queueKey);
  itemIds.forEach((id) => {
    console.log(id);
    const item = items.id(id);
    if (item) {
      item.deleteOne();
    }
  });
  user.markModified("queueMap");
  await user.save();

  console.log(user);

  return user.queueMap;
};

export const enqueueItems = async ({
  items = [],
  queueKey = "",
  username,
}: EnqueueItemsParams): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!items.length) {
    return { error: `'items' cannot be empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `user ${username} does not exist` };
  }

  items = items.map((item) => ({
    ...item,
    _id: new mongoose.Types.ObjectId(),
  }));

  console.log(user);
  const newItems = user.queueMap.has(queueKey)
    ? user.queueMap.get(queueKey).concat(items)
    : items;

  user.queueMap.set(queueKey, newItems);

  user.markModified("queueMap");

  await user.save();
  console.log(user);

  return user.queueMap;
};

export const getQueueMap = async (
  username: string
): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  return user.queueMap;
};

export const getQueue = async ({
  username,
  queueKey,
}: {
  username: string;
  queueKey: string;
}): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!queueKey) {
    return { error: `'queueKey' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  if (!user.queueMap.has(queueKey)) {
    return {
      error: `queue key '${queueKey}' does not exist as a queue of topics and questions.`,
    };
  }

  return user.queueMap.get(queueKey);
};
