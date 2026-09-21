ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN "role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN "account_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;