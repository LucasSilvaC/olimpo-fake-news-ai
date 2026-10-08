ALTER TABLE "news_analyses" ALTER COLUMN "classification" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "news_analyses" ADD COLUMN "analysis_status" text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "news_analyses" ADD COLUMN "fake_probability" double precision;--> statement-breakpoint
ALTER TABLE "news_analyses" ADD COLUMN "fake_score" double precision;--> statement-breakpoint
ALTER TABLE "news_analyses" ADD COLUMN "score_kind" text;--> statement-breakpoint
ALTER TABLE "news_analyses" ADD COLUMN "policy_version" text;--> statement-breakpoint
ALTER TABLE "news_analyses" ADD COLUMN "body_sha256" text;--> statement-breakpoint
ALTER TABLE "news_analyses" ADD COLUMN "artifact_sha256" text;--> statement-breakpoint
ALTER TABLE "news_analyses" ADD COLUMN "inference_version" text;--> statement-breakpoint
ALTER TABLE "news_analyses" ADD COLUMN "input_scope" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "news_analyses_supervised_identity_unique" ON "news_analyses" USING btree ("article_id","body_sha256","artifact_sha256","inference_version","policy_version");