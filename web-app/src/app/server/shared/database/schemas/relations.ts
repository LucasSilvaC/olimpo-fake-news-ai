import { relations } from "drizzle-orm";

import { globalChallengeAnswers, globalChallenges } from "./global-challenges";
import { newsAnalyses, newsArticles } from "./news";
import { roomMembers, roomPlaylistItems, rooms } from "./rooms";
import { users } from "./users";
import { newsVotes } from "./votes";

export const usersRelations = relations(users, ({ many }) => ({
  hostedRooms: many(rooms),
  memberships: many(roomMembers),
  votes: many(newsVotes),
  challengeAnswers: many(globalChallengeAnswers),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  host: one(users, {
    fields: [rooms.hostId],
    references: [users.id],
  }),
  members: many(roomMembers),
  playlistItems: many(roomPlaylistItems),
}));

export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  room: one(rooms, {
    fields: [roomMembers.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [roomMembers.userId],
    references: [users.id],
  }),
}));

export const roomPlaylistItemsRelations = relations(roomPlaylistItems, ({ one, many }) => ({
  room: one(rooms, {
    fields: [roomPlaylistItems.roomId],
    references: [rooms.id],
  }),
  article: one(newsArticles, {
    fields: [roomPlaylistItems.articleId],
    references: [newsArticles.id],
  }),
  votes: many(newsVotes),
}));

export const newsArticlesRelations = relations(newsArticles, ({ many }) => ({
  playlistItems: many(roomPlaylistItems),
  analyses: many(newsAnalyses),
  challenges: many(globalChallenges),
}));

export const newsAnalysesRelations = relations(newsAnalyses, ({ one }) => ({
  article: one(newsArticles, {
    fields: [newsAnalyses.articleId],
    references: [newsArticles.id],
  }),
}));

export const newsVotesRelations = relations(newsVotes, ({ one }) => ({
  playlistItem: one(roomPlaylistItems, {
    fields: [newsVotes.playlistItemId],
    references: [roomPlaylistItems.id],
  }),
  user: one(users, {
    fields: [newsVotes.userId],
    references: [users.id],
  }),
}));

export const globalChallengesRelations = relations(globalChallenges, ({ one, many }) => ({
  article: one(newsArticles, {
    fields: [globalChallenges.articleId],
    references: [newsArticles.id],
  }),
  answers: many(globalChallengeAnswers),
}));

export const globalChallengeAnswersRelations = relations(globalChallengeAnswers, ({ one }) => ({
  challenge: one(globalChallenges, {
    fields: [globalChallengeAnswers.challengeId],
    references: [globalChallenges.id],
  }),
  user: one(users, {
    fields: [globalChallengeAnswers.userId],
    references: [users.id],
  }),
}));
