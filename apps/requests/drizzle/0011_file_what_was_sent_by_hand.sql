ALTER TABLE "valence_requests"."download" ADD COLUMN "library_id" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "library_path" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "filed_into" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "filing_problem" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "filing_attempts" integer DEFAULT 0 NOT NULL;