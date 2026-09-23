import { describe, expect, it } from "vitest";

import { NewsVoteEntity, VoteOption, VALID_VOTE_OPTIONS } from "../entities";

describe("VoteOption Value Object & Validation", () => {
  it("should validate and accept the 3 valid vote options: reliable, uncertain, unreliable", () => {
    expect(VoteOption.isValid("reliable")).toBe(true);
    expect(VoteOption.isValid("uncertain")).toBe(true);
    expect(VoteOption.isValid("unreliable")).toBe(true);
    expect(VALID_VOTE_OPTIONS).toEqual(["reliable", "uncertain", "unreliable"]);
  });

  it("should reject invalid vote options", () => {
    expect(VoteOption.isValid("fake")).toBe(false);
    expect(VoteOption.isValid("true")).toBe(false);
    expect(VoteOption.isValid("")).toBe(false);
    expect(VoteOption.isValid(null as unknown as string)).toBe(false);
    expect(VoteOption.isValid(undefined as unknown as string)).toBe(false);
    expect(VoteOption.isValid(123 as unknown as string)).toBe(false);
  });

  it("should normalize valid vote options (trim and lowercase)", () => {
    expect(VoteOption.normalize(" RELIABLE ")).toBe("reliable");
    expect(VoteOption.normalize("Uncertain")).toBe("uncertain");
    expect(VoteOption.normalize("unreliable")).toBe("unreliable");
  });

  it("should throw error when normalizing invalid vote option", () => {
    expect(() => VoteOption.normalize("invalid_option")).toThrow(
      "Invalid vote option: invalid_option. Must be one of: reliable, uncertain, unreliable",
    );
  });
});

describe("NewsVoteEntity", () => {
  const defaultProps = {
    id: "vote-1",
    roomId: "room-123",
    playlistItemId: "item-456",
    userId: "user-789",
    vote: "reliable" as const,
  };

  it("should instantiate successfully with valid properties", () => {
    const vote = new NewsVoteEntity(defaultProps);

    expect(vote.id).toBe("vote-1");
    expect(vote.roomId).toBe("room-123");
    expect(vote.playlistItemId).toBe("item-456");
    expect(vote.userId).toBe("user-789");
    expect(vote.vote).toBe("reliable");
    expect(vote.isCorrect).toBeNull();
    expect(vote.pointsAwarded).toBe(0);
    expect(vote.createdAt).toBeInstanceOf(Date);
  });

  it("should throw error if required properties are missing or empty", () => {
    expect(() => new NewsVoteEntity({ ...defaultProps, id: "" })).toThrow(
      "Vote id cannot be empty",
    );
    expect(() => new NewsVoteEntity({ ...defaultProps, roomId: "" })).toThrow(
      "roomId cannot be empty",
    );
    expect(() => new NewsVoteEntity({ ...defaultProps, playlistItemId: "" })).toThrow(
      "playlistItemId cannot be empty",
    );
    expect(() => new NewsVoteEntity({ ...defaultProps, userId: "" })).toThrow(
      "userId cannot be empty",
    );
    expect(
      () =>
        new NewsVoteEntity({
          ...defaultProps,
          vote: "invalid" as unknown as "reliable",
        }),
    ).toThrow("Invalid vote option: invalid");
  });

  describe("calculateScore", () => {
    it("should award full points (100) and isCorrect = true when vote exactly matches targetClassification", () => {
      const reliableVote = new NewsVoteEntity({ ...defaultProps, vote: "reliable" });
      expect(reliableVote.calculateScore("reliable")).toEqual({
        isCorrect: true,
        pointsAwarded: 100,
      });

      const unreliableVote = new NewsVoteEntity({ ...defaultProps, vote: "unreliable" });
      expect(unreliableVote.calculateScore("unreliable")).toEqual({
        isCorrect: true,
        pointsAwarded: 100,
      });

      const uncertainVote = new NewsVoteEntity({ ...defaultProps, vote: "uncertain" });
      expect(uncertainVote.calculateScore("uncertain")).toEqual({
        isCorrect: true,
        pointsAwarded: 100,
      });
    });

    it("should award partial points (25) and isCorrect = false when user votes uncertain but target is reliable or unreliable", () => {
      const uncertainVote = new NewsVoteEntity({ ...defaultProps, vote: "uncertain" });

      expect(uncertainVote.calculateScore("reliable")).toEqual({
        isCorrect: false,
        pointsAwarded: 25,
      });

      expect(uncertainVote.calculateScore("unreliable")).toEqual({
        isCorrect: false,
        pointsAwarded: 25,
      });
    });

    it("should award 0 points and isCorrect = false when vote is wrong or opposite", () => {
      const reliableVote = new NewsVoteEntity({ ...defaultProps, vote: "reliable" });
      expect(reliableVote.calculateScore("unreliable")).toEqual({
        isCorrect: false,
        pointsAwarded: 0,
      });
      expect(reliableVote.calculateScore("uncertain")).toEqual({
        isCorrect: false,
        pointsAwarded: 0,
      });

      const unreliableVote = new NewsVoteEntity({ ...defaultProps, vote: "unreliable" });
      expect(unreliableVote.calculateScore("reliable")).toEqual({
        isCorrect: false,
        pointsAwarded: 0,
      });
      expect(unreliableVote.calculateScore("uncertain")).toEqual({
        isCorrect: false,
        pointsAwarded: 0,
      });
    });
  });

  describe("evaluate", () => {
    it("should return a new evaluated NewsVoteEntity with isCorrect and pointsAwarded", () => {
      const vote = new NewsVoteEntity(defaultProps);
      const evaluated = vote.evaluate("reliable");

      expect(evaluated.isCorrect).toBe(true);
      expect(evaluated.pointsAwarded).toBe(100);
      expect(evaluated.id).toBe(vote.id);
      expect(evaluated.roomId).toBe(vote.roomId);
    });
  });

  describe("toDTO", () => {
    it("should correctly serialize entity to DTO", () => {
      const vote = new NewsVoteEntity({
        ...defaultProps,
        isCorrect: true,
        pointsAwarded: 100,
      });

      expect(vote.toDTO()).toEqual({
        id: "vote-1",
        roomId: "room-123",
        playlistItemId: "item-456",
        userId: "user-789",
        vote: "reliable",
        isCorrect: true,
        pointsAwarded: 100,
      });
    });
  });
});
