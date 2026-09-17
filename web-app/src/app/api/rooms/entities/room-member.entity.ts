import { RoleType } from "@/server/shared/database/schemas";

export interface RoomMemberEntityProps {
  id: string;
  roomId: string;
  userId: string;
  role?: RoleType;
  score?: number;
  joinedAt?: Date;
}

export interface RoomMemberDTO {
  id: string;
  roomId: string;
  userId: string;
  role: RoleType;
  score: number;
}

export class RoomMemberEntity {
  public readonly id: string;
  public readonly roomId: string;
  public readonly userId: string;
  public readonly role: RoleType;
  public readonly score: number;
  public readonly joinedAt: Date;

  constructor(props: RoomMemberEntityProps) {
    this.id = props.id;
    this.roomId = props.roomId;
    this.userId = props.userId;
    this.role = props.role ?? "participant";
    this.score = props.score ?? 0;
    this.joinedAt = props.joinedAt ?? new Date();
  }

  public isHost(): boolean {
    return this.role === "host";
  }

  public withAddedScore(points: number): RoomMemberEntity {
    return new RoomMemberEntity({
      id: this.id,
      roomId: this.roomId,
      userId: this.userId,
      role: this.role,
      score: this.score + points,
      joinedAt: this.joinedAt,
    });
  }

  public toDTO(): RoomMemberDTO {
    return {
      id: this.id,
      roomId: this.roomId,
      userId: this.userId,
      role: this.role,
      score: this.score,
    };
  }
}
