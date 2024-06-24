import mongoose from "mongoose";

export type Tier = "free" | "tier1";

export interface Topic {
  shortSummary?: string;
  sentimentRating?: number;
  longSummary?: string;
  favorite: boolean;
  uid?: string;
}

export interface Livestream {
  createdAt: Date;
  name: string;
  topics: Topic[];
  questions: string[];
  uid?: string;
}

export interface User {
  username: string;
  tier?: Tier;
  liveStreams: Livestream[];
}

const UserSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  tier: { type: String, default: "free" },
  liveStreams: [
    {
      createdAt: { type: Date, default: Date.now },
      name: { type: String, unique: true },
      topics: [
        {
          shortSummary: String,
          sentimentRating: Number,
          longDescription: String,
        },
      ],
    },
  ],
});

const UserModel = mongoose.model("User", UserSchema);

export let mongooseConnection: typeof mongoose | undefined;

const connect = async () => {
  if (!mongooseConnection) {
    mongooseConnection = await mongoose.connect(process.env.MONGODB_ENDPOINT!);
  }
};

export const createUser = async ({
  username,
  ...update
}: Partial<User>): Promise<{ user?: User; error?: string }> => {
  if (!mongooseConnection) {
    await connect();
  }
  if (!username) {
    return { error: "'username' must be set on new User" };
  }

  let user = await UserModel.findOneAndUpdate(
    { username },
    { update },
    {
      new: true,
      upsert: true,
    }
  );

  return { user: user.toJSON() };
};

export const updateUser = async (
  updatedValues: Pick<User, "username"> & Partial<User>
): Promise<{ user?: User; error?: string }> => {
  if (!mongooseConnection) {
    await connect();
  }
  if (!updatedValues?.username) {
    return { error: "'username' must be set" };
  }

  if (Object.keys(updatedValues).length <= 1) {
    return {
      error: `No properties passed in to update for user '${updatedValues.username}'`,
    };
  }

  const { username, ...update } = updatedValues;
  let user = await UserModel.findOneAndUpdate({ username }, update, {
    new: true,
  });

  if (!user) {
    return { error: `User '${updatedValues.username}' does not exist` };
  }

  return { user: user.toJSON() };
};

export const getUser = async (
  username: string
): Promise<{ user?: User; error?: string }> => {
  if (!mongooseConnection) {
    await connect();
  }

  if (!username) {
    return { error: `'username' is empty` };
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return { error: `User '${username}' does not exist` };
  }

  return { user: user.toJSON() };
};
