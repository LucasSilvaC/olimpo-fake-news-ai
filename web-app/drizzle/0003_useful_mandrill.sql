CREATE TYPE "public"."user_role_type" AS ENUM('participant', 'admin');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role_type" DEFAULT 'participant' NOT NULL;