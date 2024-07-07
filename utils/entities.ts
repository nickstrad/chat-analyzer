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
export type Tier = "free" | "premium1";

export interface Topic {
  shortSummary: String;
  sentimentRating: Number;
  longSummary: string;
  uid?: string;
}

export type TopicListstMap = Map<string, Topic[]>;
export type SavedQuestionsMap = Map<string, Topic[]>;

const TOPIC_KEYS: {
  [key: string]: keyof Topic;
} = {
  SHORT_SUMMARY: "shortSummary",
  SENTIMENT_RATING: "sentimentRating",
  LONG_SUMMARY: "longSummary",
  UID: "uid",
};

export interface User {
  username: string;
  email: string;
  tier: Tier;
  topicListsMap: TopicListstMap;
  savedQuestionsMap: SavedQuestionsMap;
}

const USER_KEYS: {
  [key: string]: keyof User;
} = {
  USERNAME: "username",
  EMAIL: "email",
  TIER: "tier",
  TOPIC_LISTS_MAP: "topicListsMap",
  SAVED_QUESTIONS: "savedQuestionsMap",
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
export const UserSchema = new mongoose.Schema<User>(
  {
    [USER_KEYS.USERNAME]: { type: String, unique: true },
    [USER_KEYS.EMAIL]: { type: String, default: "" },
    [USER_KEYS.TIER]: { type: String, default: "free" as Tier },
    [USER_KEYS.TOPIC_LISTS_MAP]: {
      type: Map,
      default: new Map() as TopicListstMap,
      of: [
        {
          [TOPIC_KEYS.SHORT_SUMMARY]: String,
          [TOPIC_KEYS.SENTIMENT_RATING]: Number,
          [TOPIC_KEYS.LONG_SUMMARY]: String,
          [TOPIC_KEYS.UID]: String,
        },
      ],
    },
    [USER_KEYS.SAVED_QUESTIONS]: {
      type: Map,
      default: new Map() as SavedQuestionsMap,
      of: [String],
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
  topicListMapKey: string;
}

export interface SaveQuestionsParams {
  username: string;
  savedQuestionsMapKey: string;
  questions: string[];
}

export interface APIRouteResponse {
  data?: User | Map<string, Topic[]> | string[] | boolean;
  error?: string;
}

/*********
 * Random
 *********/
export type MongoHelperReturnType = User | Topic | string[];
