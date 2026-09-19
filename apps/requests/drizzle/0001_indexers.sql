CREATE TABLE "valence_requests"."indexer" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"api_key" text DEFAULT '' NOT NULL,
	"priority" integer DEFAULT 25 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requests_per_minute" integer,
	"timeout_seconds" integer DEFAULT 30 NOT NULL,
	"capabilities" jsonb,
	"failures" integer DEFAULT 0 NOT NULL,
	"last_problem" text,
	"last_failed_at" timestamp with time zone,
	"turned_off_because" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
