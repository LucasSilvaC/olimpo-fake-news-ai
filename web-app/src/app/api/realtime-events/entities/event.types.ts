import type { AIAnalysisDTO } from "@/app/api/ai-feedback";

export type RoomEventType =
  "MEMBER_JOINED" | "PRESENCE_CHANGED" | "ROUND_STARTED" | "ROUND_COMPLETED" | "MATCH_FINISHED";

export interface PresenceChangedPayload {
  userIds: string[];
}

export interface RoomEvent<T = unknown> {
  type: RoomEventType;
  roomId: string;
  pin: string;
  payload: T;
  timestamp: string;
}

export interface MemberJoinedPayload {
  member: {
    id: string;
    roomId: string;
    userId: string;
    role: string;
    score: number;
    joinedAt: Date;
  };
  membersCount?: number;
}

export interface RoundStartedPayload {
  currentRound: number;
  totalRounds: number;
}

export interface RoundCompletedLeaderboardEntry {
  userId: string;
  score: number;
  roundDelta?: number;
  isCorrect?: boolean;
}

export interface RoundCompletedPayload {
  round: number;
  leaderboard?: RoundCompletedLeaderboardEntry[];
  analysis?: AIAnalysisDTO;
}

export interface MatchFinishedLeaderboardEntry {
  userId: string;
  score: number;
  correctCount?: number;
  totalAnswered?: number;
  accuracy?: number;
}

export interface MatchFinishedPayload {
  leaderboard: MatchFinishedLeaderboardEntry[];
}
