CREATE TABLE "valence_requests"."give_up_rules" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"metadata_minutes" integer,
	"stalled_hours" integer,
	"slow_days" integer,
	"refuses_unknown_files" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
