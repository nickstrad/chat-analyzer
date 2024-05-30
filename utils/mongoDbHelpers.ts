import mongoose from "mongoose";

const TopicSchema = new mongoose.Schema({
  name: String,
  sentimentRating: Number,
  summary: String,
});

const StreamerSchema = new mongoose.Schema({
  name: String,
  liveStreams: {
    type: Map,
    of: [TopicSchema],
  },
});

const StreamerModel = mongoose.model("Streamer", StreamerSchema);

export let mongooseConnection: typeof mongoose | undefined;

const connect = async () => {
  if (!mongooseConnection) {
    mongooseConnection = await mongoose.connect(
      process.env.MONGO_DB_CONNECTION_URI!
    );
  }
};

export const createUser = async (name: string) => {
  if (!mongooseConnection) {
    await connect();
  }
  let streamer = await StreamerModel.findOne({ name });

  if (streamer) {
    throw `${name} already exists`;
  }
  streamer = new StreamerModel({ name });
  await streamer.save();
  return streamer;
};

export const getUser = async (name: string) => {
  if (!mongooseConnection) {
    await connect();
  }
  return await StreamerModel.findOne({ name });
};

export const updateLiveStream = async ({
  name,
  url,
  topics,
}: {
  name: string;
  url: string;
  topics?: { name: string; sentimentRating: number; summary: string }[];
}) => {
  if (!mongooseConnection) {
    await connect();
  }

  let streamer = await StreamerModel.findOne({ name });

  if (!streamer) {
    throw `${name} does not exist`;
  }

  if (!streamer.liveStreams) {
    streamer.liveStreams = new Map();
  }

  if (!streamer.liveStreams.has(url)) {
    streamer.liveStreams.set(url, [] as any);
  }
  const existingTopics = streamer.liveStreams.get(url)!;
  topics?.forEach((t) => existingTopics?.push(t));
  streamer.liveStreams.set(url, existingTopics);
  await streamer.save();
  return streamer;
};

export const getLiveStreamTopics = async ({
  name,
  url,
}: {
  name: string;
  url: string;
}) => {
  if (!mongooseConnection) {
    await connect();
  }

  let streamer = await StreamerModel.findOne({ name });

  if (!streamer) {
    throw `${name} does not exist`;
  }

  if (streamer?.liveStreams?.has(url)) {
    return streamer.liveStreams.get(url);
  }

  return [];
};
