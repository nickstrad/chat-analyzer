import mongoose, { mongo } from "mongoose";
import {
  APIRouteResponse,
  AddTopicParams,
  DeleteQuestionParams,
  DeleteTopicParams,
  DequeueItemsParams,
  EnqueueItemsParams,
  Question,
  Queue,
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

  return user;
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
 * Topic Helpers
 ****************/

export const deleteTopics = async ({
  topicsKey,
  topicIds,
  username,
}: DeleteTopicParams): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!topicsKey) {
    return { error: `'topicsKey' is empty` };
  }

  if (!topicIds.length) {
    return { error: `'topicIds' is an empty array` };
  }

  const user = await UserModel.findOne({ username });
  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  if (!user.topicsMap.has(topicsKey)) {
    return {
      error: `User '${username}' does not have a list of topics with the ${topicsKey} key.`,
    };
  }

  const topics = user.topicsMap.get(topicsKey);
  topicIds.forEach((id) => {
    const topic = topics.id(id);
    if (topic) {
      topic.deleteOne();
    }
  });

  await user.save();
  return user.topicsMap.get(topicsKey);
};

export const updateTopics = async ({
  topicsKey,
  topics = [],
  username,
}: AddTopicParams): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!topicsKey) {
    return { error: `'topicsKey' is empty` };
  }

  if (!topics.length) {
    return { error: `'topics' is an empty array` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  if (!user.topicsMap) {
    user.topicsMap = new Map<string, Topic[]>();
    user.topicsMap.set(topicsKey, []);
  }

  user.topicsMap.set(
    topicsKey,
    user.topicsMap.has(topicsKey)
      ? topics.concat(user.topicsMap.get(topicsKey))
      : topics
  );

  await user.save();

  return user.topicsMap.get(topicsKey);
};

export const getTopics = async (
  username: string
): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  return user.topicsMap;
};

export const getTopicsForKey = async ({
  username,
  topicsKey,
}: {
  username: string;
  topicsKey: string;
}): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!topicsKey) {
    return { error: `'topicsKey' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  return user.topicsMap.get(topicsKey);
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

  return user.questionsMap;
};

export const getSavedQuestionsForKey = async ({
  username,
  questionsKey,
}: {
  username: string;
  questionsKey: string;
}): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!questionsKey) {
    return { error: `'questionsKey' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  if (!user.questionsMap.has(questionsKey)) {
    return {
      error: `Key '${questionsKey}' does not exist for this users saved questions data.`,
    };
  }

  return user.questionsMap.get(questionsKey);
};

export const saveQuestions = async ({
  questions,
  questionsKey,
  username,
}: SaveQuestionsParams): Promise<APIRouteResponse> => {
  if (!questions.length) {
    return { error: `'questions' is empty` };
  }

  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!questionsKey) {
    return { error: `'questionsKey' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  if (!user.questionsMap.has(questionsKey)) {
    user.questionsMap.set(questionsKey, []);
  }

  user.questionsMap.set(
    questionsKey,
    user.questionsMap.get(questionsKey).concat(questions)
  );
  await user.save();

  return user.questionsMap.get(questionsKey);
};

export const deleteQuestions = async ({
  questionIds,
  questionsKey,
  username,
}: DeleteQuestionParams): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!questionsKey) {
    return { error: `'questionsKey' is empty` };
  }

  if (!questionIds.length) {
    return { error: `'questionIds' is an empty array` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  if (!user.questionsMap.has(questionsKey)) {
    return {
      error: `User '${username}' does not have a list of questions with the ${questionsKey} key.`,
    };
  }

  const questions = user.questionsMap.get(questionsKey);
  questionIds.forEach((id) => {
    const question = questions.id(id);
    if (question) {
      question.deleteOne();
    }
  });

  await user.save();
  return user.questionsMap.get(questionsKey);
};

/****************
 * Queue Helpers
 ****************/

export const dequeueItems = async ({
  questionIds = [],
  topicIds = [],
  username,
}: DequeueItemsParams): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!topicIds.length && !questionIds.length) {
    return { error: `''questionIds' and topicIds' are empty arrays` };
  }

  const updateMap = (acc: { [key: string]: boolean }, cur: string) => {
    if (!(cur in acc)) {
      acc[cur] = true;
    }
    return acc;
  };

  const topicSearchMap = topicIds.reduce(
    updateMap,
    {} as { [key: string]: boolean }
  );

  const questionSearchMap = questionIds.reduce(
    updateMap,
    {} as { [key: string]: boolean }
  );

  let user = await UserModel.findOne({ username });
  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  user = await UserModel.findOneAndUpdate(
    { username },
    {
      queue: {
        topics: user.queue.topics.filter(
          (t: any) => !(t._id in topicSearchMap)
        ),
        questions: user.queue.questions.filter(
          (t: any) => !(t._id in questionSearchMap)
        ),
      },
    },
    { new: true }
  );

  return user.queue;
};

export const enqueueItems = async ({
  topics = [],
  questions = [],
  username,
}: EnqueueItemsParams): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  if (!questions.length && !topics.length) {
    return { error: `'topics' and 'questionss' are empty arrays` };
  }
  await UserModel.updateOne(
    { username },
    {
      $push: {
        "queue.topics": {
          $each: topics.map((t) => ({
            ...t,
            _id: new mongoose.Types.ObjectId(),
          })),
        },
        "queue.questions": {
          $each: questions.map((q) => ({
            ...q,
            _id: new mongoose.Types.ObjectId(),
          })),
        },
      },
    }
  );
  const user = await UserModel.findOne({ username });
  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  return user.queue;
};

export const getQueue = async (username: string): Promise<APIRouteResponse> => {
  if (!username) {
    return { error: `'username' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }
  console.log(user);

  return user.queue;
};
