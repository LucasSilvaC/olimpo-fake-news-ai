import { beforeEach, describe, expect, it, vi } from "vitest";

import { advanceRoundAction } from "../actions/advance-round.action";
import { concludeRoundAction } from "../actions/conclude-round.action";
import { submitVoteAction } from "../actions/submit-vote.action";

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
vi.mock("../usecase/submit-vote.usecase", () => ({
  submitVoteUseCase: {
    execute: vi.fn(
      async (input: {
        roomId: string;
        userId: string;
        vote: "reliable" | "uncertain" | "unreliable";
      }) => {
        if (input.roomId === "invalid-room") {
          throw new Error('Room with id "invalid-room" not found');
        }
        if (input.roomId === "duplicate-room") {
          throw new Error("Participant has already voted in this round");
        }
        return {
          vote: {
            id: "vote-action-1",
            roomId: input.roomId,
            playlistItemId: "item-1",
            userId: input.userId,
            vote: input.vote,
            isCorrect: true,
            pointsAwarded: 100,
          },
          roundCompleted: input.roomId === "last-vote-room",
          officialAnswer: input.roomId === "last-vote-room" ? "reliable" : undefined,
          modelAnalysis: input.roomId === "last-vote-room" ? null : undefined,
          leaderboard:
            input.roomId === "last-vote-room" ? [{ userId: input.userId, score: 100 }] : undefined,
        };
      },
    ),
  },
}));

vi.mock("../usecase/advance-round.usecase", () => ({
  advanceRoundUseCase: {
    execute: vi.fn(async (input: { roomId: string; hostId: string }) => {
      if (input.roomId === "not-found") {
        throw new Error('Room with id "not-found" not found');
      }
      if (input.hostId === "not-host") {
        throw new Error("Unauthorized: Only room host can advance the round");
      }
      if (input.roomId === "final-room") {
        return {
          roomId: input.roomId,
          status: "finished" as const,
          currentRound: 3,
          totalRounds: 3,
          isMatchFinished: true,
          leaderboard: [{ userId: input.hostId, score: 300 }],
        };
      }
      return {
        roomId: input.roomId,
        status: "in_progress" as const,
        currentRound: 2,
        totalRounds: 3,
        isMatchFinished: false,
      };
    }),
  },
}));

vi.mock("../usecase/conclude-round.usecase", () => ({
  concludeRoundUseCase: {
    execute: vi.fn(async (input: { roomId: string; round: number }) => {
      if (input.roomId === "not-found") {
        throw new Error('Room with id "not-found" not found');
      }
      return {
        roundCompleted: true,
        officialAnswer: "reliable",
        modelAnalysis: null,
        leaderboard: [{ userId: "user-1", score: 100 }],
      };
    }),
  },
}));

describe("News Voting Server Actions", () => {
  beforeEach(() => {
    isAuthenticated = true;
    vi.clearAllMocks();
  });

  describe("submitVoteAction", () => {
    it("should submit a valid vote with object input", async () => {
      const result = await submitVoteAction({
        roomId: "room-1",
        vote: "reliable",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.vote.vote).toBe("reliable");
        expect(result.vote.userId).toBe("user-session-1");
        expect(result.roundCompleted).toBe(false);
        expect(result.vote.isCorrect).toBeNull();
        expect(result.vote.pointsAwarded).toBe(0);
        expect(result.officialAnswer).toBeUndefined();
        expect(result.modelAnalysis).toBeUndefined();
      }
    });

    it("should submit a valid vote with FormData input", async () => {
      const formData = new FormData();
      formData.set("roomId", "room-1");
      formData.set("vote", "unreliable");

      const result = await submitVoteAction(formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.vote.vote).toBe("unreliable");
      }
    });

    it("should return round completion data when round finishes", async () => {
      const result = await submitVoteAction({
        roomId: "last-vote-room",
        vote: "reliable",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.roundCompleted).toBe(true);
        expect(result.officialAnswer).toBe("reliable");
        expect(result.modelAnalysis).toBeNull();
        expect(result.leaderboard).toBeDefined();
      }
    });

    it("should reject when session is missing / unauthenticated", async () => {
      isAuthenticated = false;

      const result = await submitVoteAction({
        roomId: "room-1",
        vote: "reliable",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Unauthorized");
      }
    });

    it("should reject invalid vote options with schema validation error", async () => {
      const result = await submitVoteAction({
        roomId: "room-1",
        vote: "invalid_option" as unknown as "reliable",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should handle domain use case errors (e.g. duplicate vote)", async () => {
      const result = await submitVoteAction({
        roomId: "duplicate-room",
        vote: "reliable",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Participant has already voted in this round");
      }
    });
  });

  describe("advanceRoundAction", () => {
    it("should advance round successfully with object input", async () => {
      const result = await advanceRoundAction({
        roomId: "room-1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.round.currentRound).toBe(2);
        expect(result.round.isMatchFinished).toBe(false);
      }
    });

    it("should advance round with FormData input", async () => {
      const formData = new FormData();
      formData.set("roomId", "room-1");

      const result = await advanceRoundAction(formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.round.currentRound).toBe(2);
      }
    });

    it("should conclude match when advancing past final round", async () => {
      const result = await advanceRoundAction({
        roomId: "final-room",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.round.isMatchFinished).toBe(true);
        expect(result.round.status).toBe("finished");
        expect(result.round.leaderboard).toBeDefined();
      }
    });

    it("should reject when unauthenticated", async () => {
      isAuthenticated = false;

      const result = await advanceRoundAction({
        roomId: "room-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Unauthorized");
      }
    });

    it("should validate roomId requirement", async () => {
      const result = await advanceRoundAction({
        roomId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Room ID is required");
      }
    });
  });

  describe("concludeRoundAction", () => {
    it("should conclude round successfully with object input", async () => {
      const result = await concludeRoundAction({
        roomId: "room-1",
        round: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.roundCompleted).toBe(true);
        expect(result.officialAnswer).toBe("reliable");
        expect(result.modelAnalysis).toBeNull();
        expect(result.leaderboard).toBeDefined();
      }
    });

    it("should conclude round successfully with FormData input", async () => {
      const formData = new FormData();
      formData.append("roomId", "room-1");
      formData.append("round", "1");

      const result = await concludeRoundAction(formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.roundCompleted).toBe(true);
      }
    });

    it("should reject when unauthenticated", async () => {
      isAuthenticated = false;

      const result = await concludeRoundAction({
        roomId: "room-1",
        round: 1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Unauthorized");
      }
    });

    it("should validate input schema", async () => {
      const result = await concludeRoundAction({
        roomId: "",
        round: 0,
      });

      expect(result.success).toBe(false);
    });
  });
});
