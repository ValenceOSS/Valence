CREATE TABLE "valence_requests"."indexer_definition" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"language" text DEFAULT '' NOT NULL,
	"privacy" text NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"yaml" text NOT NULL,
	"sha" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "valence_requests"."indexer" ADD COLUMN "definition_id" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."indexer" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."indexer" ADD COLUMN "session" jsonb;