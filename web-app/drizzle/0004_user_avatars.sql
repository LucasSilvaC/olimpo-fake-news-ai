CREATE TYPE "public"."avatar_gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."avatar_headwear" AS ENUM('laurel', 'helmet', 'hat');--> statement-breakpoint
CREATE TYPE "public"."avatar_outfit" AS ENUM('tunic', 'armor', 'cape');--> statement-breakpoint
CREATE TYPE "public"."avatar_skin" AS ENUM('#f6d8b7', '#eac095', '#dba071', '#b97950', '#885638', '#593d32');--> statement-breakpoint
CREATE TABLE "user_avatars" (
	"user_id" text PRIMARY KEY NOT NULL,
	"gender" "avatar_gender" NOT NULL,
	"skin" "avatar_skin" NOT NULL,
	"outfit" "avatar_outfit" NOT NULL,
	"headwear" "avatar_headwear" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;