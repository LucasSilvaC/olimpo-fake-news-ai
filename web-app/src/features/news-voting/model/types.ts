export type VoteOption = "reliable" | "unreliable" | "uncertain";

export interface VoteReceipt {
  vote: VoteOption;
  pointsAwarded?: number;
  isCorrect?: boolean | null;
  officialAnswer?: VoteOption | null;
  timeTakenSeconds?: number;
  isTimeout?: boolean;
}

export interface INewsArticleData {
  id?: string;
  title: string | null;
  description: string | null;
  publisher: string | null;
  authors?: string[];
  publishedAt?: string | null;
  imageUrl?: string | null;
  url: string;
  content?: string;
}

export interface VoteSubmission {
  vote: VoteOption;
  result: import("@/app/api/news-voting/actions/submit-vote.action").SubmitVoteActionResult;
  timeTakenSeconds: number;
  isTimeout?: boolean;
}
