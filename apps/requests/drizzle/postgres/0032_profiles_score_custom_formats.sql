ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN "formats" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN "min_format_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN "upgrade_until_format_score" integer;