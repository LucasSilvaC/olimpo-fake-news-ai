export interface PlaylistItemEntityProps {
  id: string;
  roomId: string;
  articleId: string;
  roundOrder: number;
  createdAt?: Date;
}

export interface PlaylistItemDTO {
  id: string;
  roomId: string;
  articleId: string;
  roundOrder: number;
}

export class PlaylistItemEntity {
  public readonly id: string;
  public readonly roomId: string;
  public readonly articleId: string;
  public readonly roundOrder: number;
  public readonly createdAt: Date;

  constructor(props: PlaylistItemEntityProps) {
    if (props.roundOrder < 1) {
      throw new Error("Round order must be greater than or equal to 1");
    }

    this.id = props.id;
    this.roomId = props.roomId;
    this.articleId = props.articleId;
    this.roundOrder = props.roundOrder;
    this.createdAt = props.createdAt ?? new Date();
  }

  public toDTO(): PlaylistItemDTO {
    return {
      id: this.id,
      roomId: this.roomId,
      articleId: this.articleId,
      roundOrder: this.roundOrder,
    };
  }
}
