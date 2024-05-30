export interface ChannelData {
  channel: string;
  commentBatch: string[];
  topicData: LLMResponse[];
}

export interface LLMResponse {
  topic: string;
  sentimentRating: number;
  description: string;
}
