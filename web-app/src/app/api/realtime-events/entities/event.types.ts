import type { AIAnalysisDTO } from "@/app/api/ai-feedback/entities/ai-analysis.entity";
import type { MLTargetType } from "@/server/shared/database/schemas/enums";

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

export interface RoundCompletedPayload {
  round: number;
  leaderboard?: Array<{ userId: string; score: number }>;
  officialAnswer: MLTargetType;
  modelAnalysis: AIAnalysisDTO | null;
}

export interface MatchFinishedPayload {
  leaderboard: Array<{ userId: string; score: number }>;
}
