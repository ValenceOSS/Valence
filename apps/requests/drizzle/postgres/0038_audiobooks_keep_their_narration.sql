ALTER TABLE "valence_requests"."media_request" ADD COLUMN "narrations" jsonb;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "narrations_wanted" jsonb;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN "narration" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN "filed_minutes" double precision;