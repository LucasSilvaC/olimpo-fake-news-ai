import { VoteOption } from "./vote-option.vo";

import { MLTargetType, VoteOptionType } from "@/server/shared/database/schemas/enums";

export interface NewsVoteEntityProps {
  id: string;
  roomId: string;
  playlistItemId: string;
  userId: string;
  vote: VoteOptionType;
  isCorrect?: boolean | null;
  pointsAwarded?: number;
  createdAt?: Date;
}

export interface NewsVoteDTO {
  id: string;
  roomId: string;
  playlistItemId: string;
  userId: string;
  vote: VoteOptionType;
  isCorrect: boolean | null;
  pointsAwarded: number;
}

export interface ScoreEvaluationResult {
  isCorrect: boolean;
  pointsAwarded: number;
}

export class NewsVoteEntity {
  public readonly id: string;
  public readonly roomId: string;
  public readonly playlistItemId: string;
  public readonly userId: string;
  public readonly vote: VoteOptionType;
  public readonly isCorrect: boolean | null;
  public readonly pointsAwarded: number;
  public readonly createdAt: Date;

  constructor(props: NewsVoteEntityProps) {
    if (!props.id || props.id.trim() === "") {
      throw new Error("Vote id cannot be empty");
    }
    if (!props.roomId || props.roomId.trim() === "") {
      throw new Error("roomId cannot be empty");
    }
    if (!props.playlistItemId || props.playlistItemId.trim() === "") {
      throw new Error("playlistItemId cannot be empty");
    }
    if (!props.userId || props.userId.trim() === "") {
      throw new Error("userId cannot be empty");
    }

    this.vote = VoteOption.normalize(props.vote);
    this.id = props.id;
    this.roomId = props.roomId;
    this.playlistItemId = props.playlistItemId;
    this.userId = props.userId;
    this.isCorrect = props.isCorrect ?? null;
    this.pointsAwarded = props.pointsAwarded ?? 0;
    this.createdAt = props.createdAt ?? new Date();
  }

  public calculateScore(targetClassification: MLTargetType): ScoreEvaluationResult {
    if (this.vote === targetClassification) {
      return {
        isCorrect: true,
        pointsAwarded: 100,
      };
    }

    if (
      this.vote === "uncertain" &&
      (targetClassification === "reliable" || targetClassification === "unreliable")
    ) {
      return {
        isCorrect: false,
        pointsAwarded: 25,
      };
    }

    return {
      isCorrect: false,
      pointsAwarded: 0,
    };
  }

  public evaluate(targetClassification: MLTargetType): NewsVoteEntity {
    const { isCorrect, pointsAwarded } = this.calculateScore(targetClassification);

    return new NewsVoteEntity({
      id: this.id,
      roomId: this.roomId,
      playlistItemId: this.playlistItemId,
      userId: this.userId,
      vote: this.vote,
      isCorrect,
      pointsAwarded,
      createdAt: this.createdAt,
    });
  }

  public toDTO(): NewsVoteDTO {
    return {
      id: this.id,
      roomId: this.roomId,
      playlistItemId: this.playlistItemId,
      userId: this.userId,
      vote: this.vote,
      isCorrect: this.isCorrect,
      pointsAwarded: this.pointsAwarded,
    };
  }
}
