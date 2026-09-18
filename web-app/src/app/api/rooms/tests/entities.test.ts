import { describe, expect, it } from "vitest";

import { PlaylistItemEntity, RoomEntity, RoomMemberEntity, RoomPin } from "../entities";

describe("Rooms Domain Entities & Value Objects", () => {
  describe("RoomPin Value Object", () => {
    it("should generate a valid PIN formatted as 'XXX XXX'", () => {
      const pin = RoomPin.generate();
      expect(RoomPin.isValid(pin)).toBe(true);
      expect(pin).toMatch(/^\d{3} \d{3}$/);
    });

    it("should validate correctly formatted PINs", () => {
      expect(RoomPin.isValid("123 456")).toBe(true);
      expect(RoomPin.isValid("000 000")).toBe(true);
      expect(RoomPin.isValid("999 999")).toBe(true);
    });

    it("should reject invalid PIN formats", () => {
      expect(RoomPin.isValid("123456")).toBe(false);
      expect(RoomPin.isValid("12 3456")).toBe(false);
      expect(RoomPin.isValid("123 45a")).toBe(false);
      expect(RoomPin.isValid("")).toBe(false);
      expect(RoomPin.isValid("123  456")).toBe(false);
    });

    it("should normalize PIN by trimming whitespace and formatting 6 digits", () => {
      expect(RoomPin.normalize(" 123 456 ")).toBe("123 456");
      expect(RoomPin.normalize("123456")).toBe("123 456");
    });

    it("should create RoomPin instance and expose value", () => {
      const roomPin = new RoomPin("456 789");
      expect(roomPin.value).toBe("456 789");
      expect(roomPin.toString()).toBe("456 789");
    });

    it("should throw error when instantiating with invalid PIN", () => {
      expect(() => new RoomPin("invalid-pin")).toThrow("Invalid PIN format");
    });
  });

  describe("RoomEntity", () => {
    it("should instantiate a valid room entity with default values", () => {
      const room = new RoomEntity({
        id: "room-1",
        pin: "123 456",
        name: "Sala Olímpica",
        hostId: "user-host-1",
      });

      expect(room.id).toBe("room-1");
      expect(room.pin).toBe("123 456");
      expect(room.name).toBe("Sala Olímpica");
      expect(room.status).toBe("waiting");
      expect(room.roundDurationSeconds).toBe(30);
      expect(room.currentRound).toBe(0);
      expect(room.totalRounds).toBe(0);
      expect(room.hostId).toBe("user-host-1");
    });

    it("should validate room name", () => {
      expect(RoomEntity.validateName("Sala 1")).toBe(true);
      expect(RoomEntity.validateName("")).toBe(false);
      expect(RoomEntity.validateName("   ")).toBe(false);
    });

    it("should validate round duration (minimum 10 seconds)", () => {
      expect(RoomEntity.validateRoundDuration(10)).toBe(true);
      expect(RoomEntity.validateRoundDuration(45)).toBe(true);
      expect(RoomEntity.validateRoundDuration(9)).toBe(false);
      expect(RoomEntity.validateRoundDuration(0)).toBe(false);
      expect(RoomEntity.validateRoundDuration(-5)).toBe(false);
    });

    it("should throw on instantiation if duration is less than 10 seconds", () => {
      expect(
        () =>
          new RoomEntity({
            id: "room-2",
            pin: "123 456",
            name: "Invalid Duration Room",
            hostId: "host-1",
            roundDurationSeconds: 8,
          }),
      ).toThrow("Round duration must be at least 10 seconds");
    });

    it("should throw on instantiation if room name is empty", () => {
      expect(
        () =>
          new RoomEntity({
            id: "room-2",
            pin: "123 456",
            name: "",
            hostId: "host-1",
          }),
      ).toThrow("Room name cannot be empty");
    });

    it("should allow joining only when status is 'waiting'", () => {
      const waitingRoom = new RoomEntity({
        id: "r1",
        pin: "123 456",
        name: "Waiting Room",
        hostId: "host-1",
        status: "waiting",
      });
      const inProgressRoom = new RoomEntity({
        id: "r2",
        pin: "123 456",
        name: "Active Room",
        hostId: "host-1",
        status: "in_progress",
      });
      const finishedRoom = new RoomEntity({
        id: "r3",
        pin: "123 456",
        name: "Finished Room",
        hostId: "host-1",
        status: "finished",
      });

      expect(waitingRoom.canJoin()).toBe(true);
      expect(inProgressRoom.canJoin()).toBe(false);
      expect(finishedRoom.canJoin()).toBe(false);
    });

    it("should check if room can start (status waiting, >=1 member, >=1 playlist item)", () => {
      const room = new RoomEntity({
        id: "r1",
        pin: "123 456",
        name: "Room",
        hostId: "host-1",
        status: "waiting",
      });

      expect(room.canStart(1, 1)).toBe(true);
      expect(room.canStart(0, 1)).toBe(false);
      expect(room.canStart(2, 0)).toBe(false);
    });

    it("should transition status to in_progress on start", () => {
      const room = new RoomEntity({
        id: "r1",
        pin: "123 456",
        name: "Room",
        hostId: "host-1",
        status: "waiting",
      });

      const started = room.start(5);
      expect(started.status).toBe("in_progress");
      expect(started.currentRound).toBe(1);
      expect(started.totalRounds).toBe(5);
    });

    it("should throw when trying to start an already active or finished room", () => {
      const room = new RoomEntity({
        id: "r1",
        pin: "123 456",
        name: "Room",
        hostId: "host-1",
        status: "in_progress",
      });

      expect(() => room.start(3)).toThrow("Room is already started or finished");
    });

    it("should convert to DTO correctly", () => {
      const room = new RoomEntity({
        id: "room-1",
        pin: "123 456",
        name: "Olympus Lobby",
        hostId: "host-1",
        roundDurationSeconds: 40,
        currentRound: 1,
        totalRounds: 3,
        status: "in_progress",
      });

      expect(room.toDTO()).toEqual({
        id: "room-1",
        pin: "123 456",
        name: "Olympus Lobby",
        hostId: "host-1",
        roundDurationSeconds: 40,
        currentRound: 1,
        totalRounds: 3,
        status: "in_progress",
      });
    });
  });

  describe("RoomMemberEntity", () => {
    it("should instantiate room member entity with default values", () => {
      const member = new RoomMemberEntity({
        id: "mem-1",
        roomId: "room-1",
        userId: "user-1",
        role: "participant",
      });

      expect(member.id).toBe("mem-1");
      expect(member.roomId).toBe("room-1");
      expect(member.userId).toBe("user-1");
      expect(member.role).toBe("participant");
      expect(member.score).toBe(0);
      expect(member.isHost()).toBe(false);
    });

    it("should identify host correctly", () => {
      const hostMember = new RoomMemberEntity({
        id: "mem-2",
        roomId: "room-1",
        userId: "user-host",
        role: "host",
      });

      expect(hostMember.isHost()).toBe(true);
    });

    it("should return updated score with addScore", () => {
      const member = new RoomMemberEntity({
        id: "mem-1",
        roomId: "room-1",
        userId: "user-1",
        role: "participant",
        score: 100,
      });

      const updated = member.withAddedScore(50);
      expect(updated.score).toBe(150);
      expect(member.score).toBe(100); // Immutability check
    });

    it("should convert to DTO", () => {
      const member = new RoomMemberEntity({
        id: "mem-1",
        roomId: "room-1",
        userId: "user-1",
        role: "participant",
        score: 50,
      });

      expect(member.toDTO()).toEqual({
        id: "mem-1",
        roomId: "room-1",
        userId: "user-1",
        role: "participant",
        score: 50,
      });
    });
  });

  describe("PlaylistItemEntity", () => {
    it("should instantiate playlist item entity and validate round order", () => {
      const item = new PlaylistItemEntity({
        id: "item-1",
        roomId: "room-1",
        articleId: "art-1",
        roundOrder: 1,
      });

      expect(item.id).toBe("item-1");
      expect(item.roomId).toBe("room-1");
      expect(item.articleId).toBe("art-1");
      expect(item.roundOrder).toBe(1);
    });

    it("should throw when round order is less than 1", () => {
      expect(
        () =>
          new PlaylistItemEntity({
            id: "item-2",
            roomId: "room-1",
            articleId: "art-1",
            roundOrder: 0,
          }),
      ).toThrow("Round order must be greater than or equal to 1");
    });

    it("should convert to DTO", () => {
      const item = new PlaylistItemEntity({
        id: "item-1",
        roomId: "room-1",
        articleId: "art-1",
        roundOrder: 2,
      });

      expect(item.toDTO()).toEqual({
        id: "item-1",
        roomId: "room-1",
        articleId: "art-1",
        roundOrder: 2,
      });
    });
  });
});
