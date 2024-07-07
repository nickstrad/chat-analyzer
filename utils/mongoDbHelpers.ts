import mongoose from "mongoose";
import {
  APIRouteResponse,
  AddTopicParams,
  SaveQuestionsParams,
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
export const createUser = async ({
  username,
  ...update
}: Partial<User>): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: "'username' must be set on new User" };
  }

  const user = await UserModel.findOneAndUpdate(
    { username },
    { update },
    {
      new: true,
      upsert: true,
    }
  );

  return { data: user };
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

  return { data: user };
};

export const getUser = async (username: string): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  return { data: user };
};

export const deleteUser = async (
  username: string
): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  const user = await UserModel.findOneAndDelete({ username });

  return { data: !!user };
};

/****************
 * Topic Helpers
 ****************/
export const updateTopicListsMap = async ({
  topicListMapKey,
  topics = [],
  username,
}: AddTopicParams): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!topicListMapKey) {
    return { error: `'topicListMapKey' is empty` };
  }

  if (!topics.length) {
    return { error: `'topics' is an empty array` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  if (!user.topicListsMap) {
    user.topicListsMap = new Map<string, Topic[]>();
    user.topicListsMap.set(topicListMapKey, []);
  }

  const currentTopics = user.topicListsMap.get(topicListMapKey);
  user.topicListsMap.set(topicListMapKey, topics.concat(currentTopics));

  await user.save();

  return { data: user.topicListsMap };
};

export const getTopicListsMap = async (
  username: string
): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  return { data: user.topicListsMap };
};

export const getTopicListsByKey = async ({
  username,
  topicListMapKey,
}: {
  username: string;
  topicListMapKey: string;
}): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!topicListMapKey) {
    return { error: `'topicListMapKey' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  return { data: user.topicListsMap.get(topicListMapKey) };
};

/************
 * Questions
 ************/
export const getAllSavedQuestions = async (
  username: string
): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  return { data: user.savedQuestions };
};

export const getSavedQuestionsForKey = async ({
  username,
  savedQuestionsMapKey,
}: {
  username: string;
  savedQuestionsMapKey: string;
}): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!savedQuestionsMapKey) {
    return { error: `'savedQuestionsMapKey' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  if (!user.savedQuestionsMap.has(savedQuestionsMapKey)) {
    return {
      error: `Key '${savedQuestionsMapKey}' does not exist for this users saved questions data.`,
    };
  }

  return { data: user.savedQuestions.get(savedQuestionsMapKey) };
};

export const saveQuestions = async ({
  questions,
  savedQuestionsMapKey,
  username,
}: SaveQuestionsParams): Promise<APIRouteResponse> => {
  if (!questions.length) {
    return { error: `'questions' is empty` };
  }

  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!savedQuestionsMapKey) {
    return { error: `'savedQuestionsMapKey' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  if (!user.savedQuestionsMap.has(savedQuestionsMapKey)) {
    user.savedQuestionsMap.set(savedQuestionsMapKey, []);
  }

  user.savedQuestionsMap.set(
    savedQuestionsMapKey,
    user.savedQuestionsMap.get(savedQuestionsMapKey).concat(questions)
  );
  await user.save();

  return { data: user.savedQuestionsMap.get(savedQuestionsMapKey) };
};
