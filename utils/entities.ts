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
export type View = "TOPICS" | "QUESTIONS" | "QUEUE" | "SETTINGS";
export type Tier = "free" | "premium1";
export type APIAction = "PATCH" | "DELETE" | "POST" | "GET";
type ID = string | mongoose.Types.ObjectId;
export interface Topic {
  shortSummary: String;
  sentimentRating: Number;
  longSummary: string;
  _id?: ID;
}

export interface Question {
  user: string;
  question: string;
  _id?: ID;
}

export type Item = Partial<Question> & Partial<Topic>;
export type Queue = Item[];
export interface QueueObject {
  [key: string]: Queue;
}
export type QueueMap = Map<string, Queue> | QueueObject;

const TOPIC_KEYS: {
  [key: string]: keyof Topic;
} = {
  SHORT_SUMMARY: "shortSummary",
  SENTIMENT_RATING: "sentimentRating",
  LONG_SUMMARY: "longSummary",
  ID: "_id",
};

const QUESTION_KEYS: {
  [key: string]: keyof Question;
} = {
  USER: "user",
  QUESTION: "question",
  ID: "_id",
};

export interface User {
  username: string;
  email: string;
  tier: Tier;
  queueMap: QueueMap;
  currentQueueKey: string;
}

const USER_KEYS: {
  [key: string]: keyof User;
} = {
  USERNAME: "username",
  EMAIL: "email",
  TIER: "tier",
  QUEUE_MAP: "queueMap",
  CURRENT_QUEUE_KEY: "currentQueueKey",
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

const ITEM_SCHEMA = {
  [TOPIC_KEYS.SHORT_SUMMARY]: String,
  [TOPIC_KEYS.SENTIMENT_RATING]: Number,
  [TOPIC_KEYS.LONG_SUMMARY]: String,
  [QUESTION_KEYS.USER]: String,
  [QUESTION_KEYS.QUESTION]: String,
  [QUESTION_KEYS.ID]: mongoose.Types.ObjectId,
};

const DEFAUL_QUEUE_KEY = "default";
const QUEUE_MAP_SCHEMA = {
  type: Map,
  default: new Map(
    Object.entries({
      [DEFAUL_QUEUE_KEY]: [],
    } as any)
  ) as QueueMap,
  of: [ITEM_SCHEMA],
};

export const UserSchema = new mongoose.Schema<User>(
  {
    [USER_KEYS.USERNAME]: { type: String, unique: true },
    [USER_KEYS.EMAIL]: { type: String, default: "" },
    [USER_KEYS.TIER]: { type: String, default: "free" as Tier },
    [USER_KEYS.QUEUE_MAP]: QUEUE_MAP_SCHEMA,
    [USER_KEYS.CURRENT_QUEUE_KEY]: { type: String, default: DEFAUL_QUEUE_KEY },
  },
  {
    toJSON: {
      transform: function (doc, ret) {
        ret._id = ret._id.toString();
      },
    },
  }
);

export const UserModel =
  mongoose?.models?.User ?? mongoose.model<User>("User", UserSchema);
/*********************
 * API route entities
 **********************/
export interface EnqueueItemsParams {
  username: string;
  queueKey: string;
  items?: Item[];
}

export interface DequeueItemsParams {
  username: string;
  queueKey: string;
  itemIds: string[];
}

export type APIRouteResponse =
  | boolean
  | User
  | QueueMap
  | Queue
  | { error: string };

/*********
 * Random
 *********/
export type MongoHelperReturnType = User | Topic | string[];
