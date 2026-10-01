CREATE TABLE "valence_requests"."arr_app" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"api_key" text DEFAULT '' NOT NULL,
	"remote_path" text DEFAULT '' NOT NULL,
	"local_path" text DEFAULT '' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"is_working" boolean,
	"version" text,
	"last_checked_at" timestamp with time zone,
	"last_problem" jsonb,
	"last_problem_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "valence_requests"."indexer" ADD COLUMN "source_app_id" uuid;--> statement-breakpoint
ALTER TABLE "valence_requests"."indexer" ADD COLUMN "source_indexer_id" integer;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "tvdb_id" integer;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "hand_off" jsonb;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "hand_off_id" integer;