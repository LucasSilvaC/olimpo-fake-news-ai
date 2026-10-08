import { notFound } from "next/navigation";

import { drizzleNewsAnalysisRepository } from "@/app/api/ai-feedback/repositories/drizzle-news-analysis.repository";
import { drizzleNewsArticleRepository } from "@/app/api/ai-feedback/repositories/drizzle-news-article.repository";
import { drizzleUserRepository } from "@/app/api/auth/repositories/drizzle-user.repository";
import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";
import { drizzleNewsVoteRepository } from "@/app/api/news-voting/repositories/drizzle-news-vote.repository";
import { RoomPin } from "@/app/api/rooms/entities/room-pin.vo";
import { drizzleRoomRepository } from "@/app/api/rooms/repositories/drizzle-room.repository";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import {
  RoomGameView,
  type IUserVoteState,
  type RoomGameMember,
  type RoomGamePlaylistItem,
} from "@/views/room-game";
import { RoomLobbyView, type RoomLobbyMember } from "@/views/room-lobby";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}): Promise<React.ReactElement> {
  const [{ codigo }, user] = await Promise.all([params, getSessionUseCase.execute()]);
  let decodedCodigo: string;
  try {
    decodedCodigo = decodeURIComponent(codigo);
  } catch {
    notFound();
  }
  const pin = RoomPin.normalize(decodedCodigo);

  if (!RoomPin.isValid(pin)) {
    notFound();
  }

  const room = await drizzleRoomRepository.findByPin(pin);
  if (!room) {
    notFound();
  }

  const [roomMembers, playlistItems] = await Promise.all([
    drizzleRoomRepository.listMembers(room.id),
    drizzleRoomRepository.getPlaylistItems(room.id),
  ]);

  const members = await Promise.all(
    roomMembers.map(async (roomMember): Promise<RoomLobbyMember> => {
      const [profile, avatar] = await Promise.all([
        drizzleUserRepository.findById(roomMember.userId),
        drizzleUserRepository.findAvatarByUserId(roomMember.userId),
      ]);

      return {
        id: roomMember.id,
        userId: roomMember.userId,
        name: profile?.name ?? "Investigador",
        role: roomMember.role,
        score: roomMember.score,
        avatar: avatar ?? DEFAULT_AVATAR,
      };
    }),
  );

  if (room.status === "in_progress" || room.status === "finished") {
    const playlistArticles: RoomGamePlaylistItem[] = await Promise.all(
      playlistItems.map(async (item) => {
        const articleRecord = await drizzleNewsArticleRepository.findById(item.articleId);
        const article = articleRecord?.article;
        return {
          id: item.id,
          roundOrder: item.roundOrder,
          title: article?.title ?? "Notícia sem título",
          description: article?.description ?? null,
          publisher: article?.publisher ?? null,
          authors: article?.authors ?? [],
          publishedAt: article?.publishedAt ?? null,
          imageUrl: article?.imageUrl ?? null,
          url: article?.url ?? "",
          content: article?.content ?? "",
        };
      }),
    );

    const activeItem = playlistItems.find((item) => item.roundOrder === room.currentRound);
    let initialVote: IUserVoteState | null = null;
    if (activeItem) {
      const existingVote = await drizzleNewsVoteRepository.findByParticipantAndPlaylistItem(
        activeItem.id,
        user.id,
      );
      if (existingVote) {
        const [articleRecord, existingAnalysis] = await Promise.all([
          drizzleNewsArticleRepository.findById(activeItem.articleId),
          drizzleNewsAnalysisRepository.findByArticleId(activeItem.articleId),
        ]);
        const confidenceScore = existingAnalysis
          ? Math.round(
              Number(existingAnalysis.confidence) *
                (Number(existingAnalysis.confidence) <= 1 ? 100 : 1),
            )
          : 85;

        initialVote = {
          vote: existingVote.vote,
          pointsAwarded: existingVote.pointsAwarded,
          isCorrect: existingVote.isCorrect,
          officialAnswer: articleRecord?.targetClassification ?? null,
          reliabilityScore: confidenceScore,
          reasons: existingAnalysis?.reasons,
        };
      }
    }

    const roomVotes =
      typeof drizzleNewsVoteRepository?.listByRoomId === "function"
        ? ((await drizzleNewsVoteRepository.listByRoomId(room.id)) ?? [])
        : [];
    const correctCountMap = new Map<string, number>();
    for (const v of roomVotes) {
      if (v.isCorrect) {
        correctCountMap.set(v.userId, (correctCountMap.get(v.userId) ?? 0) + 1);
      }
    }

    const gameMembers: RoomGameMember[] = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name,
      role: m.role,
      score: m.score,
      correctCount: correctCountMap.get(m.userId) ?? 0,
    }));

    return (
      <RoomGameView
        room={{
          id: room.id,
          pin: room.pin,
          name: room.name,
          hostId: room.hostId,
          status: room.status,
          roundDurationSeconds: room.roundDurationSeconds,
          currentRound: room.currentRound,
          totalRounds: room.totalRounds,
        }}
        members={gameMembers}
        playlistArticles={playlistArticles}
        currentUserId={user.id}
        initialVote={initialVote}
      />
    );
  }

  const newsPreviews =
    room.hostId === user.id
      ? await Promise.all(
          playlistItems.map(async (item) => {
            const article = await drizzleNewsArticleRepository.findById(item.articleId);
            return {
              id: item.id,
              roundOrder: item.roundOrder,
              title: article?.article.title ?? "Notícia sem título",
              description: article?.article.description ?? null,
              publisher: article?.article.publisher ?? null,
              url: article?.article.url ?? "",
            };
          }),
        )
      : [];

  return (
    <RoomLobbyView
      room={{
        id: room.id,
        pin: room.pin,
        name: room.name,
        hostId: room.hostId,
        status: room.status,
        roundDurationSeconds: room.roundDurationSeconds,
        currentRound: room.currentRound,
        totalRounds: room.totalRounds,
      }}
      members={members}
      playlistCount={playlistItems.length}
      newsPreviews={newsPreviews}
      currentUserId={user.id}
    />
  );
}
