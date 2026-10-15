ALTER TABLE "valence_requests"."media_request" ADD COLUMN "series_asin" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "series_request_id" uuid;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "books" jsonb;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "companions_wanted" jsonb;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "keeps_one_narrator" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "series_narrators" jsonb;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD CONSTRAINT "media_request_book_series" UNIQUE("kind","series_asin");