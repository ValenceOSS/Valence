ALTER TABLE "valence_requests"."media_request" ADD COLUMN "upgrades_to_lossless" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN "track_count" integer;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN "filed_track_count" integer;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN "held_quality" text;