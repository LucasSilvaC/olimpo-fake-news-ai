export interface AtomicVoteResult {
  isFirstVote: boolean;
  currentVoteCount: number;
}

export interface IRedisVoteRepository {
  recordVoteAtomic(roomId: string, roundOrder: number, userId: string): Promise<AtomicVoteResult>;
  getVoteCount(roomId: string, roundOrder: number): Promise<number>;
  hasUserVoted(roomId: string, roundOrder: number, userId: string): Promise<boolean>;
  getVotedUserIds(roomId: string, roundOrder: number): Promise<string[]>;
  clearRoundVotes(roomId: string, roundOrder: number): Promise<void>;
}
