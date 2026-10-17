import type { ListedGlobalChallengeDTO } from "@/app/api/global-challenges/contracts";
import type { VoteReceipt } from "@/features/news-voting";
import type { AvatarConfig } from "@/lib/avatar";

export type ChallengeGameStage = "CHECKING" | "WAITING" | "ROUND_SCOREBOARD" | "MATCH_FINALE";

export interface IChallengeUser {
  id: string;
  name: string;
  avatar?: AvatarConfig;
  xp?: number;
}

export type IUserVoteState = VoteReceipt;

export interface IChallengeGameViewProps {
  challenges: ListedGlobalChallengeDTO[];
  currentUser: IChallengeUser;
}
