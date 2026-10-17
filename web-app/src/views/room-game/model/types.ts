import type { INewsArticleData, VoteReceipt } from "@/features/news-voting";
import type { RoomStatus } from "@/server/shared/domain/game-vocabulary";

export type GameStage = "CHECKING" | "WAITING" | "ROUND_SCOREBOARD" | "MATCH_FINALE";

export interface RoomGameMember {
  id: string;
  userId: string;
  name: string;
  role: string;
  score: number;
  avatar?: string;
  correctCount?: number;
}

export interface RoomGameRoom {
  id: string;
  pin: string;
  name: string;
  hostId: string;
  status: RoomStatus;
  roundDurationSeconds: number;
  roundStartedAt?: string;
  currentRound: number;
  totalRounds: number;
}

export interface RoomGamePlaylistItem extends INewsArticleData {
  roundOrder: number;
}

export type IUserVoteState = VoteReceipt;

export interface IRoomPlayerState {
  userId: string;
  name: string;
  score: number;
  roundDelta: number;
  streak: number;
  isCorrect?: boolean;
  timeSeconds?: number;
  correctCount: number;
  avatar?: string;
}

export interface IRoomGameViewProps {
  room: RoomGameRoom;
  members: RoomGameMember[];
  playlistArticles: RoomGamePlaylistItem[];
  currentUserId: string;
  initialStage?: GameStage;
  initialVote?: IUserVoteState | null;
  initialRoundClosed?: boolean;
}
