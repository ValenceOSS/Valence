ALTER TABLE "valence_requests"."indexer" ADD COLUMN "removes_when_done" boolean;--> statement-breakpoint
ALTER TABLE "valence_requests"."indexer" ADD COLUMN "seed_seconds" integer;--> statement-breakpoint
ALTER TABLE "valence_requests"."indexer" ADD COLUMN "seed_ratio" double precision;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "library_language" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN "preferred_language" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN "role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN "account_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN "downloaded_bytes" double precision;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN "download_seconds" double precision;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "removes_when_done" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "seed_seconds" integer;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "seed_ratio" double precision;