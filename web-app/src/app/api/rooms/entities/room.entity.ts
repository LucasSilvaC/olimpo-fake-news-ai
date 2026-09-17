import { RoomPin } from "./room-pin.vo";

import { RoomStatus } from "@/server/shared/database/schemas";

export interface RoomEntityProps {
  id: string;
  pin: string;
  name: string;
  hostId: string;
  status?: RoomStatus;
  roundDurationSeconds?: number;
  currentRound?: number;
  totalRounds?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoomDTO {
  id: string;
  pin: string;
  name: string;
  hostId: string;
  status: RoomStatus;
  roundDurationSeconds: number;
  currentRound: number;
  totalRounds: number;
}

export class RoomEntity {
  public readonly id: string;
  public readonly pin: string;
  public readonly name: string;
  public readonly hostId: string;
  public readonly status: RoomStatus;
  public readonly roundDurationSeconds: number;
  public readonly currentRound: number;
  public readonly totalRounds: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: RoomEntityProps) {
    if (!RoomEntity.validateName(props.name)) {
      throw new Error("Room name cannot be empty");
    }

    const duration = props.roundDurationSeconds ?? 30;
    if (!RoomEntity.validateRoundDuration(duration)) {
      throw new Error("Round duration must be at least 10 seconds");
    }

    this.id = props.id;
    this.pin = RoomPin.normalize(props.pin);
    this.name = props.name.trim();
    this.hostId = props.hostId;
    this.status = props.status ?? "waiting";
    this.roundDurationSeconds = duration;
    this.currentRound = props.currentRound ?? 0;
    this.totalRounds = props.totalRounds ?? 0;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public static validateName(name: string): boolean {
    if (!name || typeof name !== "string") return false;
    return name.trim().length > 0;
  }

  public static validateRoundDuration(durationSeconds: number): boolean {
    if (typeof durationSeconds !== "number" || isNaN(durationSeconds)) return false;
    return durationSeconds >= 10;
  }

  public canJoin(): boolean {
    return this.status === "waiting";
  }

  public canStart(participantCount: number, playlistItemsCount: number): boolean {
    return this.status === "waiting" && participantCount >= 1 && playlistItemsCount >= 1;
  }

  public start(totalRounds: number): RoomEntity {
    if (this.status !== "waiting") {
      throw new Error("Room is already started or finished");
    }

    return new RoomEntity({
      id: this.id,
      pin: this.pin,
      name: this.name,
      hostId: this.hostId,
      status: "in_progress",
      roundDurationSeconds: this.roundDurationSeconds,
      currentRound: 1,
      totalRounds,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  public toDTO(): RoomDTO {
    return {
      id: this.id,
      pin: this.pin,
      name: this.name,
      hostId: this.hostId,
      status: this.status,
      roundDurationSeconds: this.roundDurationSeconds,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
    };
  }
}
