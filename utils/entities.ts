import mongoose from "mongoose";
import { z } from "zod";

/*
 * There is an overlap of the scehmas and types and this entities files we consolidate
 * the differetn LLM output schemas, database schemas, and typescript types into the
 * same file since they enforce types/schemas on the same data.
 */

/********************
 * TypeScript Types
 ********************/
export type View = "TOPICS" | "QUESTIONS" | "QUEUE";
export type Tier = "free" | "premium1";

export interface Topic {
  shortSummary: String;
  sentimentRating: Number;
  longSummary: string;
  _id?: string;
}

export interface Question {
  user: string;
  question: string;
}

export interface Queue {
  topics: Topic[];
  questions: Question[];
}

export type TopicsMap = Map<string, Topic[]>;
export type QuestionsMap = Map<string, Topic[]>;

const QUESTION_KEYS: {
  [key: string]: keyof Question;
} = {
  USER: "user",
  QUESTION: "question",
};

const TOPIC_KEYS: {
  [key: string]: keyof Topic;
} = {
  SHORT_SUMMARY: "shortSummary",
  SENTIMENT_RATING: "sentimentRating",
  LONG_SUMMARY: "longSummary",
};

const QUEUE_KEYS: {
  [key: string]: keyof Queue;
} = {
  TOPICS: "topics",
  QUESTIONS: "questions",
};

export interface User {
  username: string;
  email: string;
  tier: Tier;
  topicsMap: TopicsMap;
  questionsMap: QuestionsMap;
  queue: Queue;
}

const USER_KEYS: {
  [key: string]: keyof User;
} = {
  USERNAME: "username",
  EMAIL: "email",
  TIER: "tier",
  TOPICS_MAP: "topicsMap",
  QUESTIONS_MAP: "questionsMap",
  QUEUE: "queue",
};

/**************
 * zod schemas
 **************/
const LLM_TOPIC_ZOD_SCHEMA = {
  [TOPIC_KEYS.SHORT_SUMMARY]: z
    .string()
    .describe("A 1 to 5 word summary of topic"),
  [TOPIC_KEYS.LONG_SUMMARY]: z
    .string()
    .describe("A 7 to 20 word summary of topic"),
  [TOPIC_KEYS.SENTIMENT_RATING]: z
    .number()
    .describe(
      "A number indicating the positive sentiment rating of the topic between 0 to 1000"
    ),
};

export const LLM_TOPICS_ARRAY_ZOD_SCHEMA = z.array(
  z.object(LLM_TOPIC_ZOD_SCHEMA)
);

/*******************
 * mongoose schemas
 *******************/
const TOPICS_SCHEMA_OBJECT = {
  [TOPIC_KEYS.SHORT_SUMMARY]: String,
  [TOPIC_KEYS.SENTIMENT_RATING]: Number,
  [TOPIC_KEYS.LONG_SUMMARY]: String,
  [TOPIC_KEYS.UID]: String,
};

const QUESTIONS_SCHEMA_OBJECT = {
  [QUESTION_KEYS.USER]: String,
  [QUESTION_KEYS.QUESTION]: String,
};

const QUEUE_SCHEMA_OBJECT = {
  [QUEUE_KEYS.QUESTIONS]: {
    of: [QUESTIONS_SCHEMA_OBJECT],
    default: [] as Question[],
  },
  [QUEUE_KEYS.TOPICS]: {
    of: [TOPICS_SCHEMA_OBJECT],
    default: [] as Topic[],
  },
};

export const UserSchema = new mongoose.Schema<User>(
  {
    [USER_KEYS.USERNAME]: { type: String, unique: true },
    [USER_KEYS.EMAIL]: { type: String, default: "" },
    [USER_KEYS.TIER]: { type: String, default: "free" as Tier },
    [USER_KEYS.TOPICS_MAP]: {
      type: Map,
      default: new Map() as TopicsMap,
      of: [TOPICS_SCHEMA_OBJECT],
    },
    [USER_KEYS.QUESTIONS_MAP]: {
      type: Map,
      default: new Map() as QuestionsMap,
      of: [QUESTIONS_SCHEMA_OBJECT],
    },
    // [USER_KEYS.QUEUE]: {
    //   type: Object,
    //   default: { topics: [], questions: [] } as Queue,
    //   of: {
    //     of: QUEUE_SCHEMA_OBJECT,
    //     default: { topics: [] as Topic[], questions: [] as Question[] },
    //   },
    // },
    [USER_KEYS.QUEUE]: {
      type: Object,
      default: { topics: [], questions: [] } as Queue,
      of: {
        of: {
          topics: [TOPICS_SCHEMA_OBJECT],
          questions: [QUESTIONS_SCHEMA_OBJECT],
        },
      },
    },
  },
  {
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
      },
    },
  }
);

export const UserModel =
  mongoose?.models?.User ?? mongoose.model<User>("User", UserSchema);
/*********************
 * API route entities
 **********************/
export interface AddTopicParams {
  username: string;
  topics: Topic[];
  topicsKey: string;
}

export interface DeleteTopicParams {
  username: string;
  topicIds: string[];
  topicsKey: string;
}

export interface SaveQuestionsParams {
  username: string;
  questionsKey: string;
  questions: string[];
}
export interface DeleteQuestionParams {
  username: string;
  questionIds: string[];
  questionsKey: string;
}

export interface EnqueueItemsParams {
  username: string;
  topics?: Topic[];
  questions?: Question[];
}

export interface DequeueItemsParams {
  username: string;
  questionIds: string[];
  topicIds: string[];
}

export type APIRouteResponse =
  | User
  | Map<string, Topic[]>
  | string[]
  | boolean
  | Queue
  | { error: string };

/*********
 * Random
 *********/
export type MongoHelperReturnType = User | Topic | string[];
