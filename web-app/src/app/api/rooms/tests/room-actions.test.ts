import { beforeEach, describe, expect, it, vi } from "vitest";

import { addPlaylistNewsAction } from "../actions/add-playlist-news.action";
import { createRoomAction } from "../actions/create-room.action";
import { joinRoomAction } from "../actions/join-room.action";
import { startGameAction } from "../actions/start-game.action";

// Mock session
const mockSessionUser = {
  id: "user-session-1",
  email: "session@olympus.ai",
  name: "Session User",
  xp: 100,
};

let isAuthenticated = true;

vi.mock("@/app/api/auth/usecase/get-session.usecase", () => ({
  getSessionUseCase: {
    execute: vi.fn(async () => {
      if (!isAuthenticated) {
        throw new Error("Unauthorized: Missing session token");
      }
      return mockSessionUser;
    }),
  },
}));

// Mock use cases
vi.mock("../usecase/create-room.usecase", () => ({
  createRoomUseCase: {
    execute: vi.fn(
      async (input: { hostId: string; name: string; roundDurationSeconds?: number }) => {
        if (!input.name) throw new Error("Room name cannot be empty");
        return {
          room: {
            id: "room-created-1",
            pin: "123 456",
            name: input.name,
            hostId: input.hostId,
            status: "waiting",
            roundDurationSeconds: input.roundDurationSeconds ?? 30,
            currentRound: 0,
            totalRounds: 0,
          },
          pin: "123 456",
        };
      },
    ),
  },
}));

vi.mock("../usecase/join-room.usecase", () => ({
  joinRoomUseCase: {
    execute: vi.fn(async (input: { userId: string; pin: string }) => {
      if (input.pin === "000 000") throw new Error("Room not found");
      return {
        room: {
          id: "room-joined-1",
          pin: input.pin,
          name: "Sala Aberta",
          hostId: "user-host-other",
          status: "waiting",
          roundDurationSeconds: 30,
          currentRound: 0,
          totalRounds: 0,
        },
        member: {
          id: "mem-joined-1",
          roomId: "room-joined-1",
          userId: input.userId,
          role: "participant",
          score: 0,
        },
        alreadyJoined: false,
      };
    }),
  },
}));

vi.mock("../usecase/add-playlist-news.usecase", () => ({
  addPlaylistNewsUseCase: {
    execute: vi.fn(
      async (input: {
        roomId: string;
        hostId: string;
        news: Array<{ articleId?: string; url?: string }>;
      }) => {
        if (!input.news || input.news.length === 0) {
          throw new Error("At least one news item must be provided");
        }
        return {
          playlistItems: input.news.map((item, idx) => ({
            id: `item-${idx + 1}`,
            roomId: input.roomId,
            articleId: item.articleId || "extracted-art-1",
            roundOrder: idx + 1,
          })),
          totalRounds: input.news.length,
        };
      },
    ),
  },
}));

vi.mock("../usecase/start-game.usecase", () => ({
  startGameUseCase: {
    execute: vi.fn(async (input: { roomId: string; hostId: string }) => {
      if (input.roomId === "empty-room") {
        throw new Error("Cannot start game: room must have at least one member");
      }
      return {
        room: {
          id: input.roomId,
          pin: "123 456",
          name: "Sala Ativa",
          hostId: input.hostId,
          status: "in_progress",
          roundDurationSeconds: 30,
          currentRound: 1,
          totalRounds: 3,
        },
      };
    }),
  },
}));

describe("Rooms Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAuthenticated = true;
  });

  describe("createRoomAction", () => {
    it("should successfully create room for authenticated user using JSON input", async () => {
      const result = await createRoomAction({
        name: "Sala dos Deuses",
        roundDurationSeconds: 40,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.room.name).toBe("Sala dos Deuses");
        expect(result.pin).toBe("123 456");
      }
    });

    it("should accept FormData input", async () => {
      const formData = new FormData();
      formData.append("name", "Sala FormData");
      formData.append("roundDurationSeconds", "25");

      const result = await createRoomAction(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.room.name).toBe("Sala FormData");
      }
    });

    it("should fail validation when name is missing", async () => {
      const result = await createRoomAction({
        name: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should reject when user is not authenticated", async () => {
      isAuthenticated = false;

      const result = await createRoomAction({
        name: "Sala Não Autenticada",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/unauthorized/i);
      }
    });
  });

  describe("joinRoomAction", () => {
    it("should join room successfully with valid PIN", async () => {
      const result = await joinRoomAction({
        pin: "123 456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.room.id).toBe("room-joined-1");
        expect(result.member.userId).toBe(mockSessionUser.id);
      }
    });

    it("should accept FormData with PIN", async () => {
      const formData = new FormData();
      formData.append("pin", "123 456");

      const result = await joinRoomAction(formData);
      expect(result.success).toBe(true);
    });

    it("should fail when PIN is empty", async () => {
      const result = await joinRoomAction({
        pin: "",
      });

      expect(result.success).toBe(false);
    });

    it("should return error when usecase throws room not found", async () => {
      const result = await joinRoomAction({
        pin: "000 000",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Room not found");
      }
    });
  });

  describe("addPlaylistNewsAction", () => {
    it("should add playlist items successfully", async () => {
      const result = await addPlaylistNewsAction({
        roomId: "room-1",
        news: [{ articleId: "art-1" }, { url: "https://news.com/article" }],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.playlistItems).toHaveLength(2);
        expect(result.totalRounds).toBe(2);
      }
    });

    it("should reject when news array is empty", async () => {
      const result = await addPlaylistNewsAction({
        roomId: "room-1",
        news: [],
      });

      expect(result.success).toBe(false);
    });
  });

  describe("startGameAction", () => {
    it("should start game successfully", async () => {
      const result = await startGameAction({
        roomId: "room-1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.room.status).toBe("in_progress");
        expect(result.room.currentRound).toBe(1);
      }
    });

    it("should return error when room cannot be started", async () => {
      const result = await startGameAction({
        roomId: "empty-room",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Cannot start game");
      }
    });
  });
});
