ALTER TABLE "valence_requests"."indexer" ADD COLUMN "last_problem_code" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "problem_code" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN "problem_code" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_log" ADD COLUMN "problem_code" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "problem_code" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "filing_problem_code" text;