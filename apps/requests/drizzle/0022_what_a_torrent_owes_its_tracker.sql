ALTER TABLE "valence_requests"."indexer" ADD COLUMN "removes_when_done" boolean;--> statement-breakpoint
ALTER TABLE "valence_requests"."indexer" ADD COLUMN "seed_seconds" integer;--> statement-breakpoint
ALTER TABLE "valence_requests"."indexer" ADD COLUMN "seed_ratio" double precision;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "removes_when_done" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "seed_seconds" integer;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "seed_ratio" double precision;