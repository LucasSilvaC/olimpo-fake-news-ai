import { pgEnum, pgTable, text } from "drizzle-orm/pg-core";

import { users } from "./users";

export const avatarGenderEnum = pgEnum("avatar_gender", ["male", "female"]);
export const avatarSkinEnum = pgEnum("avatar_skin", [
  "#f6d8b7",
  "#eac095",
  "#dba071",
  "#b97950",
  "#885638",
  "#593d32",
]);
export const avatarOutfitEnum = pgEnum("avatar_outfit", ["tunic", "armor", "cape"]);
export const avatarHeadwearEnum = pgEnum("avatar_headwear", ["laurel", "helmet", "hat"]);

export const userAvatars = pgTable("user_avatars", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  gender: avatarGenderEnum("gender").notNull(),
  skin: avatarSkinEnum("skin").notNull(),
  outfit: avatarOutfitEnum("outfit").notNull(),
  headwear: avatarHeadwearEnum("headwear").notNull(),
});

export type UserAvatar = typeof userAvatars.$inferSelect;
export type NewUserAvatar = typeof userAvatars.$inferInsert;
