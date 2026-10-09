ALTER TABLE "valence_requests"."media_request" ADD COLUMN "versions" jsonb;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN "version_profile_id" uuid;