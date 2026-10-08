import { beforeEach, describe, expect, it, vi } from "vitest";

import { INewsVoteRepository, IRedisVoteRepository } from "../repositories";
import { SubmitVoteUseCase } from "../usecase/submit-vote.usecase";

import { INewsArticleRepository } from "@/app/api/ai-feedback/repositories/news-article.repository.interface";
import { GetArticleAnalysisUseCase } from "@/app/api/ai-feedback/usecase/get-article-analysis.usecase";
import { IEventPublisher } from "@/app/api/realtime-events";
import { IRoomRepository, IRedisRoomRepository } from "@/app/api/rooms/repositories";
import { NewsArticle, Room, RoomMember, RoomPlaylistItem } from "@/server/shared/database/schemas";

describe("SubmitVoteUseCase", () => {
  let newsVoteRepository: INewsVoteRepository;
  let redisVoteRepository: IRedisVoteRepository;
  let roomRepository: IRoomRepository;
  let redisRoomRepository: IRedisRoomRepository;
  let newsArticleRepository: INewsArticleRepository;
  let getArticleAnalysisUseCase: GetArticleAnalysisUseCase;
  let mockEventPublisher: IEventPublisher;
  let useCase: SubmitVoteUseCase;

  const sampleRoom: Room = {
    id: "room-1",
    pin: "123 456",
    name: "Test Room",
    status: "in_progress",
    roundDurationSeconds: 30,
    currentRound: 1,
    totalRounds: 3,
    hostId: "host-user",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleMember: RoomMember = {
    id: "mem-1",
    roomId: "room-1",
    userId: "user-1",
    role: "participant",
    score: 0,
    joinedAt: new Date(),
  };

  const samplePlaylistItem: RoomPlaylistItem = {
    id: "item-1",
    roomId: "room-1",
    articleId: "art-1",
    roundOrder: 1,
    createdAt: new Date(),
  };

  const sampleArticle: NewsArticle = {
    id: "art-1",
    article: {
      url: "https://example.com/news/1",
      canonicalUrl: "https://example.com/news/1",
      title: "Breaking News: Fact Check",
      description: null,
      authors: ["Jane Doe"],
      publishedAt: new Date().toISOString(),
      modifiedAt: null,
      content: "Content about something real",
      imageUrl: null,
      publisher: "NewsCorp",
      language: "en",
      extractionMethod: "local",
      usedFallback: false,
    },
    targetClassification: "reliable",
    createdAt: new Date(),
  };

  const sampleAnalysis = {
    id: "analysis-1",
    articleId: "art-1",
    classification: "reliable" as const,
    confidence: 0.95,
    reasons: ["Verified sources", "Consistent facts"],
    modelVersion: "mock-ai-v1",
  };

  beforeEach(() => {
    newsVoteRepository = {
      create: vi.fn(async (data) => ({
        ...data,
        createdAt: data.createdAt ?? new Date(),
      })) as unknown as INewsVoteRepository["create"],
      findById: vi.fn(),
      findByParticipantAndPlaylistItem: vi.fn().mockResolvedValue(null),
      listByPlaylistItem: vi.fn(),
      listByRoomId: vi.fn(),
      countByPlaylistItem: vi.fn(),
      updateEvaluation: vi.fn(),
    };

    redisVoteRepository = {
      recordVoteAtomic: vi.fn().mockResolvedValue({
        isFirstVote: true,
        currentVoteCount: 1,
      }),
      getVoteCount: vi.fn().mockResolvedValue(1),
      hasUserVoted: vi.fn().mockResolvedValue(false),
      getVotedUserIds: vi.fn().mockResolvedValue(["user-1"]),
      clearRoundVotes: vi.fn(),
      markRoundCompleted: vi.fn().mockResolvedValue(true),
      isRoundCompleted: vi.fn().mockResolvedValue(false),
    };

    roomRepository = {
      findById: vi.fn().mockResolvedValue(sampleRoom),
      findByPin: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateRoom: vi.fn(),
      addMember: vi.fn(),
      findMember: vi.fn().mockResolvedValue(sampleMember),
      listMembers: vi.fn().mockResolvedValue([sampleMember]),
      countMembers: vi.fn().mockResolvedValue(2),
      updateMemberScore: vi.fn().mockResolvedValue({ ...sampleMember, score: 100 }),
      addPlaylistItems: vi.fn(),
      getPlaylistItems: vi.fn().mockResolvedValue([samplePlaylistItem]),
    };

    redisRoomRepository = {
      setRoomPin: vi.fn(),
      getRoomByPin: vi.fn(),
      removeRoomPin: vi.fn(),
      updateRoomStatus: vi.fn(),
      setParticipantCount: vi.fn(),
      getParticipantCount: vi.fn(),
      incrementParticipantCount: vi.fn(),
      addMemberToLeaderboard: vi.fn(),
      getLeaderboard: vi.fn().mockResolvedValue([{ userId: "user-1", score: 100 }]),
    };

    newsArticleRepository = {
      findById: vi.fn().mockResolvedValue(sampleArticle),
      create: vi.fn(),
    };

    getArticleAnalysisUseCase = {
      execute: vi.fn().mockResolvedValue(sampleAnalysis),
    } as unknown as GetArticleAnalysisUseCase;

    mockEventPublisher = {
      publish: vi.fn(async () => 1),
    };

    useCase = new SubmitVoteUseCase(
      newsVoteRepository,
      redisVoteRepository,
      roomRepository,
      redisRoomRepository,
      newsArticleRepository,
      getArticleAnalysisUseCase,
      mockEventPublisher,
    );
  });

  it("publishes round points independently of cumulative scores without invoking ML", async () => {
    vi.mocked(roomRepository.countMembers).mockResolvedValue(1);
    vi.mocked(redisRoomRepository.getLeaderboard).mockResolvedValue([
      { userId: "user-1", score: 225 },
    ]);
    vi.mocked(newsVoteRepository.listByPlaylistItem).mockResolvedValue([
      {
        id: "vote-1",
        roomId: "room-1",
        playlistItemId: "item-1",
        userId: "user-1",
        vote: "uncertain",
        isCorrect: false,
        pointsAwarded: 25,
        createdAt: new Date(),
      },
    ]);
    const result = await useCase.execute({ roomId: "room-1", userId: "user-1", vote: "uncertain" });
    expect(result.leaderboard).toEqual([
      { userId: "user-1", score: 225, roundDelta: 25, isCorrect: false },
    ]);
    expect(result.officialAnswer).toBe("reliable");
    expect(result.modelAnalysis).toBeNull();
    expect(getArticleAnalysisUseCase.execute).not.toHaveBeenCalled();
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      "123 456",
      expect.objectContaining({
        payload: expect.objectContaining({
          officialAnswer: "reliable",
          modelAnalysis: null,
          leaderboard: result.leaderboard,
        }),
      }),
    );
  });

  it("should record a valid vote and award points when vote matches ground truth", async () => {
    const result = await useCase.execute({
      roomId: "room-1",
      userId: "user-1",
      vote: "reliable",
    });

    expect(result.vote.vote).toBe("reliable");
    expect(result.vote.isCorrect).toBeNull();
    expect(result.vote.pointsAwarded).toBe(0);
    expect(result.roundCompleted).toBe(false);

    expect(newsVoteRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: "room-1",
        playlistItemId: "item-1",
        userId: "user-1",
        vote: "reliable",
        isCorrect: true,
        pointsAwarded: 100,
      }),
    );
    expect(roomRepository.updateMemberScore).toHaveBeenCalledWith("room-1", "user-1", 100);
    expect(redisRoomRepository.addMemberToLeaderboard).toHaveBeenCalledWith(
      "room-1",
      "user-1",
      100,
    );
    expect(redisVoteRepository.recordVoteAtomic).toHaveBeenCalledWith("room-1", 1, "user-1");
  });

  it("should award partial points when vote is uncertain on reliable/unreliable article", async () => {
    const result = await useCase.execute({
      roomId: "room-1",
      userId: "user-1",
      vote: "uncertain",
    });

    expect(result.vote.isCorrect).toBeNull();
    expect(result.vote.pointsAwarded).toBe(0);
    expect(roomRepository.updateMemberScore).toHaveBeenCalledWith("room-1", "user-1", 25);
  });

  it("should award 0 points when vote is wrong", async () => {
    const result = await useCase.execute({
      roomId: "room-1",
      userId: "user-1",
      vote: "unreliable",
    });

    expect(result.vote.isCorrect).toBeNull();
    expect(result.vote.pointsAwarded).toBe(0);
    expect(roomRepository.updateMemberScore).not.toHaveBeenCalled();
  });

  it("should reject vote if room does not exist", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        roomId: "room-non-existent",
        userId: "user-1",
        vote: "reliable",
      }),
    ).rejects.toThrow('Room with id "room-non-existent" not found');
  });

  it("should reject vote if room is not in progress", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValueOnce({
      ...sampleRoom,
      status: "waiting",
    });

    await expect(
      useCase.execute({
        roomId: "room-1",
        userId: "user-1",
        vote: "reliable",
      }),
    ).rejects.toThrow("Cannot submit vote: room is not in progress");
  });

  it("should reject vote if room is finished", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValueOnce({
      ...sampleRoom,
      status: "finished",
    });

    await expect(
      useCase.execute({
        roomId: "room-1",
        userId: "user-1",
        vote: "reliable",
      }),
    ).rejects.toThrow("Cannot submit vote: room is not in progress");
  });

  it("should reject vote if user is not a member of the room", async () => {
    vi.mocked(roomRepository.findMember).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        roomId: "room-1",
        userId: "outsider-user",
        vote: "reliable",
      }),
    ).rejects.toThrow("User is not a member of this room");
  });

  it("should prevent duplicate votes in the same round (via Redis check)", async () => {
    vi.mocked(redisVoteRepository.hasUserVoted).mockResolvedValueOnce(true);

    await expect(
      useCase.execute({
        roomId: "room-1",
        userId: "user-1",
        vote: "reliable",
      }),
    ).rejects.toThrow("Participant has already voted in this round");
  });

  it("should prevent duplicate votes in the same round (via DB check)", async () => {
    vi.mocked(newsVoteRepository.findByParticipantAndPlaylistItem).mockResolvedValueOnce({
      id: "existing-vote",
      roomId: "room-1",
      playlistItemId: "item-1",
      userId: "user-1",
      vote: "reliable",
      isCorrect: true,
      pointsAwarded: 100,
      createdAt: new Date(),
    });

    await expect(
      useCase.execute({
        roomId: "room-1",
        userId: "user-1",
        vote: "reliable",
      }),
    ).rejects.toThrow("Participant has already voted in this round");
  });

  it("should detect round completion when all participants have voted, defer model analysis, and return leaderboard", async () => {
    // Total members: 2, current votes: 2 (this was the last vote)
    vi.mocked(roomRepository.countMembers).mockResolvedValueOnce(2);
    vi.mocked(redisVoteRepository.recordVoteAtomic).mockResolvedValueOnce({
      isFirstVote: true,
      currentVoteCount: 2,
    });

    vi.mocked(getArticleAnalysisUseCase.execute).mockRejectedValue(new Error("Model offline"));
    const result = await useCase.execute({
      roomId: "room-1",
      userId: "user-1",
      vote: "reliable",
    });

    expect(result.roundCompleted).toBe(true);
    expect(result.officialAnswer).toBe("reliable");
    expect(result.modelAnalysis).toBeNull();
    expect(result.leaderboard).toEqual([expect.objectContaining({ userId: "user-1", score: 100 })]);
    expect(getArticleAnalysisUseCase.execute).not.toHaveBeenCalled();
    expect(redisRoomRepository.getLeaderboard).toHaveBeenCalledWith("room-1");
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      "123 456",
      expect.objectContaining({
        type: "ROUND_COMPLETED",
        roomId: "room-1",
        pin: "123 456",
        payload: {
          round: 1,
          leaderboard: [expect.objectContaining({ userId: "user-1", score: 100 })],
          officialAnswer: "reliable",
          modelAnalysis: null,
        },
      }),
    );
  });

  it("awards 0 points and marks isCorrect false when vote is a timeout submission", async () => {
    const result = await useCase.execute({
      roomId: "room-1",
      userId: "user-1",
      vote: "reliable",
      isTimeout: true,
    });

    expect(result.vote.pointsAwarded).toBe(0);
    expect(result.vote.isCorrect).toBeNull();
    expect(roomRepository.updateMemberScore).not.toHaveBeenCalled();
  });

  it("does not publish duplicate ROUND_COMPLETED event if already marked completed", async () => {
    vi.mocked(roomRepository.countMembers).mockResolvedValueOnce(2);
    vi.mocked(redisVoteRepository.recordVoteAtomic).mockResolvedValueOnce({
      isFirstVote: true,
      currentVoteCount: 2,
    });
    vi.mocked(redisVoteRepository.markRoundCompleted).mockResolvedValueOnce(false);

    vi.mocked(getArticleAnalysisUseCase.execute).mockRejectedValue(new Error("Model offline"));
    const result = await useCase.execute({
      roomId: "room-1",
      userId: "user-1",
      vote: "reliable",
    });

    expect(result.roundCompleted).toBe(true);
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });
});
