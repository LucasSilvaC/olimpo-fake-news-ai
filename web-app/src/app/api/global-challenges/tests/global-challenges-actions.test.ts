import { beforeEach, describe, expect, it, vi } from "vitest";

import { answerGlobalChallengeAction } from "../actions/answer-global-challenge.action";
import { listGlobalChallengesAction } from "../actions/list-global-challenges.action";

const mockSessionUser = {
  id: "user-session-1",
  email: "session@olympus.ai",
  name: "Session User",
  xp: 200,
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

vi.mock("../usecase/answer-global-challenge.usecase", () => ({
  answerGlobalChallengeUseCase: {
    execute: vi.fn(
      async (input: {
        challengeId: string;
        userId: string;
        answer: "reliable" | "uncertain" | "unreliable";
      }) => {
        if (input.challengeId === "invalid-chal") {
          throw new Error('Global challenge with id "invalid-chal" not found');
        }
        if (input.challengeId === "already-answered") {
          throw new Error("User has already answered this challenge");
        }
        return {
          answer: {
            id: "ans-action-1",
            challengeId: input.challengeId,
            userId: input.userId,
            answer: input.answer,
            isCorrect: true,
            xpAwarded: 50,
            answeredAt: new Date(),
          },
          isCorrect: true,
          xpAwarded: 50,
          targetClassification: "reliable" as const,
        };
      },
    ),
  },
}));

vi.mock("../usecase/list-global-challenges.usecase", () => ({
  listGlobalChallengesUseCase: {
    execute: vi.fn(async (input?: { userId?: string }) => {
      return [
        {
          id: "chal-1",
          title: "Desafio 1",
          articleId: "art-1",
          xpReward: 50,
          isActive: true,
          createdAt: new Date(),
          article: {
            id: "art-1",
            title: "News 1",
            content: "Content 1",
            url: "https://news.com/1",
            source: "Source 1",
            author: "Author 1",
            publishedAt: new Date(),
          },
          isAnswered: input?.userId === "user-session-1",
          userAnswer: input?.userId === "user-session-1" ? "reliable" : undefined,
          userIsCorrect: input?.userId === "user-session-1" ? true : undefined,
          userXpAwarded: input?.userId === "user-session-1" ? 50 : undefined,
        },
      ];
    }),
  },
}));

describe("Global Challenges Server Actions", () => {
  beforeEach(() => {
    isAuthenticated = true;
    vi.clearAllMocks();
  });

  describe("answerGlobalChallengeAction", () => {
    it("should successfully answer challenge using typed object input", async () => {
      const res = await answerGlobalChallengeAction({
        challengeId: "chal-1",
        answer: "reliable",
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.isCorrect).toBe(true);
        expect(res.xpAwarded).toBe(50);
        expect(res.targetClassification).toBe("reliable");
        expect(res.answer.challengeId).toBe("chal-1");
      }
    });

    it("should successfully answer challenge using FormData input", async () => {
      const formData = new FormData();
      formData.set("challengeId", "chal-1");
      formData.set("answer", "reliable");

      const res = await answerGlobalChallengeAction(formData);

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.isCorrect).toBe(true);
        expect(res.xpAwarded).toBe(50);
      }
    });

    it("should fail when user is not authenticated", async () => {
      isAuthenticated = false;

      const res = await answerGlobalChallengeAction({
        challengeId: "chal-1",
        answer: "reliable",
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("Unauthorized");
      }
    });

    it("should fail when input validation fails (invalid answer)", async () => {
      const res = await answerGlobalChallengeAction({
        challengeId: "chal-1",
        answer: "invalid" as unknown as "reliable",
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("Answer must be 'reliable', 'uncertain', or 'unreliable'");
      }
    });

    it("should fail when input validation fails (missing challengeId)", async () => {
      const res = await answerGlobalChallengeAction({
        challengeId: "",
        answer: "reliable",
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("Challenge ID is required");
      }
    });

    it("should return error when use case throws (e.g. challenge not found)", async () => {
      const res = await answerGlobalChallengeAction({
        challengeId: "invalid-chal",
        answer: "reliable",
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain('Global challenge with id "invalid-chal" not found');
      }
    });

    it("should return error when use case throws (already answered)", async () => {
      const res = await answerGlobalChallengeAction({
        challengeId: "already-answered",
        answer: "reliable",
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("User has already answered this challenge");
      }
    });
  });

  describe("listGlobalChallengesAction", () => {
    it("should return challenges with user personalization when authenticated", async () => {
      const res = await listGlobalChallengesAction();

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.challenges).toHaveLength(1);
        expect(res.challenges[0]?.isAnswered).toBe(true);
      }
    });

    it("should return challenges without personalization when unauthenticated", async () => {
      isAuthenticated = false;

      const res = await listGlobalChallengesAction();

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.challenges).toHaveLength(1);
        expect(res.challenges[0]?.isAnswered).toBe(false);
      }
    });
  });
});
