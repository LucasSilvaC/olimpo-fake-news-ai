import { VoteOption } from "@/app/api/news-voting/entities";
import { MLTargetType, VoteOptionType } from "@/server/shared/database/schemas/enums";

export interface GlobalChallengeAnswerEntityProps {
  id: string;
  challengeId: string;
  userId: string;
  answer: VoteOptionType;
  isCorrect?: boolean | null;
  xpAwarded?: number;
  answeredAt?: Date;
}

export interface GlobalChallengeAnswerDTO {
  id: string;
  challengeId: string;
  userId: string;
  answer: VoteOptionType;
  isCorrect: boolean;
  xpAwarded: number;
  answeredAt: Date;
}

export interface ChallengeEvaluationResult {
  isCorrect: boolean;
  xpAwarded: number;
}

export class GlobalChallengeAnswerEntity {
  public readonly id: string;
  public readonly challengeId: string;
  public readonly userId: string;
  public readonly answer: VoteOptionType;
  public readonly isCorrect: boolean | null;
  public readonly xpAwarded: number;
  public readonly answeredAt: Date;

  constructor(props: GlobalChallengeAnswerEntityProps) {
    if (!props.id || props.id.trim() === "") {
      throw new Error("Answer id cannot be empty");
    }
    if (!props.challengeId || props.challengeId.trim() === "") {
      throw new Error("challengeId cannot be empty");
    }
    if (!props.userId || props.userId.trim() === "") {
      throw new Error("userId cannot be empty");
    }

    this.answer = VoteOption.normalize(props.answer);
    this.id = props.id.trim();
    this.challengeId = props.challengeId.trim();
    this.userId = props.userId.trim();
    this.isCorrect = props.isCorrect ?? null;
    this.xpAwarded = props.xpAwarded ?? 0;
    this.answeredAt = props.answeredAt ?? new Date();
  }

  public calculateScore(
    targetClassification: MLTargetType,
    challengeXpReward: number,
  ): ChallengeEvaluationResult {
    const isCorrect = this.answer === targetClassification;
    const xpAwarded = isCorrect ? Math.max(0, challengeXpReward) : 0;

    return {
      isCorrect,
      xpAwarded,
    };
  }

  public evaluate(
    targetClassification: MLTargetType,
    challengeXpReward: number,
  ): GlobalChallengeAnswerEntity {
    const { isCorrect, xpAwarded } = this.calculateScore(targetClassification, challengeXpReward);

    return new GlobalChallengeAnswerEntity({
      id: this.id,
      challengeId: this.challengeId,
      userId: this.userId,
      answer: this.answer,
      isCorrect,
      xpAwarded,
      answeredAt: this.answeredAt,
    });
  }

  public toDTO(): GlobalChallengeAnswerDTO {
    return {
      id: this.id,
      challengeId: this.challengeId,
      userId: this.userId,
      answer: this.answer,
      isCorrect: this.isCorrect ?? false,
      xpAwarded: this.xpAwarded,
      answeredAt: this.answeredAt,
    };
  }
}
