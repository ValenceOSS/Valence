ALTER TABLE "valence_requests"."request_item" ADD COLUMN "missing_from" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "request_id" uuid;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "is_unneeded" boolean DEFAULT false NOT NULL;