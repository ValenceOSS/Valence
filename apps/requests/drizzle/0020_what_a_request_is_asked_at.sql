ALTER TABLE "valence_requests"."indexer" ADD COLUMN IF NOT EXISTS "removes_when_done" boolean;--> statement-breakpoint
ALTER TABLE "valence_requests"."indexer" ADD COLUMN IF NOT EXISTS "seed_seconds" integer;--> statement-breakpoint
ALTER TABLE "valence_requests"."indexer" ADD COLUMN IF NOT EXISTS "seed_ratio" double precision;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN IF NOT EXISTS "library_language" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN IF NOT EXISTS "preferred_language" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN IF NOT EXISTS "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN IF NOT EXISTS "role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN IF NOT EXISTS "account_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN IF NOT EXISTS "downloaded_bytes" double precision;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN IF NOT EXISTS "download_seconds" double precision;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN IF NOT EXISTS "removes_when_done" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN IF NOT EXISTS "seed_seconds" integer;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN IF NOT EXISTS "seed_ratio" double precision;