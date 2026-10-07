import { beforeEach, describe, expect, it, vi } from "vitest";

import { INewsVoteRepository, IRedisVoteRepository } from "../repositories";
import { ConcludeRoundUseCase } from "../usecase/conclude-round.usecase";

import { INewsArticleRepository } from "@/app/api/ai-feedback/repositories/news-article.repository.interface";
import { GetArticleAnalysisUseCase } from "@/app/api/ai-feedback/usecase/get-article-analysis.usecase";
import { IEventPublisher } from "@/app/api/realtime-events";
import { IRedisRoomRepository, IRoomRepository } from "@/app/api/rooms/repositories";
import { NewsArticle, Room, RoomMember, RoomPlaylistItem } from "@/server/shared/database/schemas";

describe("ConcludeRoundUseCase", () => {
  let newsVoteRepository: INewsVoteRepository;
  let redisVoteRepository: IRedisVoteRepository;
  let roomRepository: IRoomRepository;
  let redisRoomRepository: IRedisRoomRepository;
  let newsArticleRepository: INewsArticleRepository;
  let getArticleAnalysisUseCase: GetArticleAnalysisUseCase;
  let mockEventPublisher: IEventPublisher;
  let useCase: ConcludeRoundUseCase;

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

  const sampleMembers: RoomMember[] = [
    {
      id: "mem-1",
      roomId: "room-1",
      userId: "user-1",
      role: "host",
      score: 100,
      joinedAt: new Date(),
    },
    {
      id: "mem-2",
      roomId: "room-1",
      userId: "user-2",
      role: "participant",
      score: 0,
      joinedAt: new Date(),
    },
  ];

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
      title: "Fact Check News",
      description: null,
      authors: ["Reporter"],
      publishedAt: new Date().toISOString(),
      modifiedAt: null,
      content: "Content",
      imageUrl: null,
      publisher: "News",
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
    reasons: ["Verified source", "Factual consistency"],
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
      findMember: vi.fn(),
      listMembers: vi.fn().mockResolvedValue(sampleMembers),
      countMembers: vi.fn().mockResolvedValue(2),
      updateMemberScore: vi.fn(),
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
      publish: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new ConcludeRoundUseCase(
      newsVoteRepository,
      redisVoteRepository,
      roomRepository,
      redisRoomRepository,
      newsArticleRepository,
      getArticleAnalysisUseCase,
      mockEventPublisher,
    );
  });

  it("concludes round, creates timeout vote for non-voted member, and broadcasts ROUND_COMPLETED", async () => {
    // user-1 voted, user-2 did not
    const result = await useCase.execute({
      roomId: "room-1",
      round: 1,
    });

    expect(result.roundCompleted).toBe(true);
    expect(result.analysis).toEqual(sampleAnalysis);
    expect(redisVoteRepository.markRoundCompleted).toHaveBeenCalledWith("room-1", 1);

    // Timeout vote created for user-2
    expect(newsVoteRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: "room-1",
        userId: "user-2",
        vote: "uncertain",
        isCorrect: false,
        pointsAwarded: 0,
      }),
    );

    // user-1 already voted, so no extra vote created for user-1
    expect(newsVoteRepository.create).toHaveBeenCalledTimes(1);

    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      "123 456",
      expect.objectContaining({
        type: "ROUND_COMPLETED",
        roomId: "room-1",
        payload: {
          round: 1,
          leaderboard: [{ userId: "user-1", score: 100 }],
          analysis: sampleAnalysis,
        },
      }),
    );
  });

  it("returns roundCompleted true without republishing if round was already marked completed", async () => {
    vi.mocked(redisVoteRepository.markRoundCompleted).mockResolvedValueOnce(false);

    const result = await useCase.execute({
      roomId: "room-1",
      round: 1,
    });

    expect(result.roundCompleted).toBe(true);
    expect(newsVoteRepository.create).not.toHaveBeenCalled();
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });

  it("returns roundCompleted false if round order does not match currentRound", async () => {
    const result = await useCase.execute({
      roomId: "room-1",
      round: 2, // room is at round 1
    });

    expect(result.roundCompleted).toBe(false);
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });

  it("throws error if room is not found", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        roomId: "missing-room",
        round: 1,
      }),
    ).rejects.toThrow('Room with id "missing-room" not found');
  });

  it("throws error if room is not in progress", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValueOnce({
      ...sampleRoom,
      status: "waiting",
    });

    await expect(
      useCase.execute({
        roomId: "room-1",
        round: 1,
      }),
    ).rejects.toThrow("Cannot conclude round: room is not in progress");
  });
});
