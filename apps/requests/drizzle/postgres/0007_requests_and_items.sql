CREATE TABLE "valence_requests"."blocklisted_release" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"title" text NOT NULL,
	"indexer_id" uuid,
	"reason" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocklisted_release_title" UNIQUE("request_id","title")
);
--> statement-breakpoint
CREATE TABLE "valence_requests"."media_request" (
	"id" uuid PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"tmdb_id" integer NOT NULL,
	"title" text NOT NULL,
	"year" integer,
	"overview" text,
	"poster_url" text,
	"library_id" text NOT NULL,
	"library_path" text NOT NULL,
	"approval" text DEFAULT 'awaiting' NOT NULL,
	"refused_because" text,
	"requested_by_id" text NOT NULL,
	"requested_by_name" text NOT NULL,
	"seasons" jsonb,
	"is_watching_future" boolean DEFAULT true NOT NULL,
	"wait_for" text DEFAULT 'digital' NOT NULL,
	"runtime_minutes" integer,
	"release_dates" jsonb DEFAULT '{"theatrical":null,"digital":null,"physical":null}'::jsonb NOT NULL,
	"is_ended" boolean DEFAULT false NOT NULL,
	"media_id" text,
	"problem" text,
	"catalogue_checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_request_title" UNIQUE("kind","tmdb_id")
);
--> statement-breakpoint
CREATE TABLE "valence_requests"."request_item" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"season" integer,
	"episode" integer,
	"title" text NOT NULL,
	"air_date" text,
	"state" text DEFAULT 'waiting' NOT NULL,
	"problem" text,
	"release_title" text,
	"indexer_id" uuid,
	"download_id" uuid,
	"file_path" text,
	"score" double precision,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_searched_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "request_item_episode" UNIQUE("request_id","season","episode")
);
--> statement-breakpoint
ALTER TABLE "valence_requests"."download_event" ALTER COLUMN "client_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."download_client" ADD COLUMN "remote_path" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."download_client" ADD COLUMN "local_path" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."download_event" ADD COLUMN "details" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."download" ADD COLUMN "content_path" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."blocklisted_release" ADD CONSTRAINT "blocklisted_release_request_id_media_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "valence_requests"."media_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD CONSTRAINT "request_item_request_id_media_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "valence_requests"."media_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD CONSTRAINT "request_item_download_id_download_id_fk" FOREIGN KEY ("download_id") REFERENCES "valence_requests"."download"("id") ON DELETE set null ON UPDATE no action;