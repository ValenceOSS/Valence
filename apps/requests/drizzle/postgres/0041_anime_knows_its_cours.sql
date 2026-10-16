ALTER TABLE "valence_requests"."media_request" ADD COLUMN "anime" jsonb;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "anime_audio" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "preferred_group" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "cour_order" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "numbering_by_group" jsonb;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "anime_questions" jsonb;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN "anime_audio" text DEFAULT 'subbed' NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN "cour" integer;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN "absolute" integer;