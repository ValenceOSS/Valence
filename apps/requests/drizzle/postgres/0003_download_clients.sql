CREATE TABLE "valence_requests"."download_client" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"username" text DEFAULT '' NOT NULL,
	"password" text DEFAULT '' NOT NULL,
	"api_key" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'valence' NOT NULL,
	"priority" integer DEFAULT 25 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "valence_requests"."download_event" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "valence_requests"."download_event_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"client_name" text NOT NULL,
	"problem" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "valence_requests"."download" (
	"id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"remote_id" text NOT NULL,
	"protocol" text NOT NULL,
	"title" text NOT NULL,
	"indexer_name" text,
	"state" text DEFAULT 'queued' NOT NULL,
	"problem" text,
	"progress" double precision DEFAULT 0 NOT NULL,
	"size_bytes" double precision,
	"done_bytes" double precision,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "download_client_remote" UNIQUE("client_id","remote_id")
);
--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD CONSTRAINT "download_client_id_download_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "valence_requests"."download_client"("id") ON DELETE cascade ON UPDATE no action;