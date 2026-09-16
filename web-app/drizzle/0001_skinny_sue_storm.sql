CREATE TYPE "public"."ml_target_type" AS ENUM('reliable', 'uncertain', 'unreliable');--> statement-breakpoint
CREATE TYPE "public"."role_type" AS ENUM('host', 'participant');--> statement-breakpoint
CREATE TYPE "public"."room_status_type" AS ENUM('waiting', 'in_progress', 'finished');--> statement-breakpoint
CREATE TYPE "public"."vote_option_type" AS ENUM('reliable', 'uncertain', 'unreliable');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"pin" varchar(7) NOT NULL,
	"name" text NOT NULL,
	"status" "room_status_type" DEFAULT 'waiting' NOT NULL,
	"round_duration_seconds" integer DEFAULT 30 NOT NULL,
	"current_round" integer DEFAULT 0 NOT NULL,
	"total_rounds" integer DEFAULT 0 NOT NULL,
	"host_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_pin_unique" UNIQUE("pin")
);
--> statement-breakpoint
CREATE TABLE "room_members" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "role_type" DEFAULT 'participant' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"source" text,
	"author" text,
	"published_at" timestamp with time zone,
	"target_classification" "ml_target_type" DEFAULT 'uncertain' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_playlist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"article_id" text NOT NULL,
	"round_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"classification" "ml_target_type" NOT NULL,
	"reasons" jsonb NOT NULL,
	"confidence" numeric(4, 2),
	"model_version" text DEFAULT 'mock-v1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"playlist_item_id" text NOT NULL,
	"user_id" text NOT NULL,
	"vote" "vote_option_type" NOT NULL,
	"is_correct" boolean,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"article_id" text NOT NULL,
	"xp_reward" integer DEFAULT 50 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_challenge_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"challenge_id" text NOT NULL,
	"user_id" text NOT NULL,
	"answer" "vote_option_type" NOT NULL,
	"is_correct" boolean NOT NULL,
	"xp_awarded" integer DEFAULT 0 NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "example_records" CASCADE;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_playlist_items" ADD CONSTRAINT "room_playlist_items_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_playlist_items" ADD CONSTRAINT "room_playlist_items_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_analyses" ADD CONSTRAINT "news_analyses_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_votes" ADD CONSTRAINT "news_votes_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_votes" ADD CONSTRAINT "news_votes_playlist_item_id_room_playlist_items_id_fk" FOREIGN KEY ("playlist_item_id") REFERENCES "public"."room_playlist_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_votes" ADD CONSTRAINT "news_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_challenges" ADD CONSTRAINT "global_challenges_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_challenge_answers" ADD CONSTRAINT "global_challenge_answers_challenge_id_global_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."global_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_challenge_answers" ADD CONSTRAINT "global_challenge_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "room_members_room_user_idx" ON "room_members" USING btree ("room_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "room_playlist_items_room_order_idx" ON "room_playlist_items" USING btree ("room_id","round_order");--> statement-breakpoint
CREATE UNIQUE INDEX "news_votes_playlist_item_user_idx" ON "news_votes" USING btree ("playlist_item_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "global_challenge_answers_challenge_user_idx" ON "global_challenge_answers" USING btree ("challenge_id","user_id");