export interface GlobalChallengeEntityProps {
  id: string;
  title: string;
  articleId: string;
  xpReward?: number;
  isActive?: boolean;
  createdAt?: Date;
}

export interface GlobalChallengeDTO {
  id: string;
  title: string;
  articleId: string;
  xpReward: number;
  isActive: boolean;
  createdAt: Date;
}

export class GlobalChallengeEntity {
  public readonly id: string;
  public readonly title: string;
  public readonly articleId: string;
  public readonly xpReward: number;
  public readonly isActive: boolean;
  public readonly createdAt: Date;

  constructor(props: GlobalChallengeEntityProps) {
    if (!props.id || props.id.trim() === "") {
      throw new Error("Challenge id cannot be empty");
    }
    if (!props.title || props.title.trim() === "") {
      throw new Error("Challenge title cannot be empty");
    }
    if (!props.articleId || props.articleId.trim() === "") {
      throw new Error("Challenge articleId cannot be empty");
    }

    const xp = props.xpReward ?? 50;
    if (xp < 0) {
      throw new Error("Challenge xpReward cannot be negative");
    }

    this.id = props.id.trim();
    this.title = props.title.trim();
    this.articleId = props.articleId.trim();
    this.xpReward = xp;
    this.isActive = props.isActive ?? true;
    this.createdAt = props.createdAt ?? new Date();
  }

  public toDTO(): GlobalChallengeDTO {
    return {
      id: this.id,
      title: this.title,
      articleId: this.articleId,
      xpReward: this.xpReward,
      isActive: this.isActive,
      createdAt: this.createdAt,
    };
  }
}
