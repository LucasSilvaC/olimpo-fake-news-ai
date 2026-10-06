ALTER TABLE "news_articles" ADD COLUMN "article" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "news_articles" DROP COLUMN "url";--> statement-breakpoint
ALTER TABLE "news_articles" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "news_articles" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "news_articles" DROP COLUMN "source";--> statement-breakpoint
ALTER TABLE "news_articles" DROP COLUMN "author";--> statement-breakpoint
ALTER TABLE "news_articles" DROP COLUMN "published_at";