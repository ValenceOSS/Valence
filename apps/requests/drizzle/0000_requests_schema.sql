CREATE SCHEMA IF NOT EXISTS "valence_requests";
--> statement-breakpoint
CREATE TABLE "valence_requests"."setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
