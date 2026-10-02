CREATE TABLE "account_setup_link" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"tokenHash" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"usedAt" timestamp,
	"revokedAt" timestamp,
	"createdBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_setup_link_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "collection" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"artworkPath" text,
	"isOrdered" boolean DEFAULT false NOT NULL,
	"createdBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"collectionId" text NOT NULL,
	"mediaItemId" text,
	"seriesId" text,
	"position" double precision NOT NULL,
	"addedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collection_entry_one_subject" CHECK (num_nonnulls("collection_entry"."mediaItemId", "collection_entry"."seriesId") = 1)
);
--> statement-breakpoint
CREATE TABLE "email_send" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"recipient" text NOT NULL,
	"idempotencyKey" text NOT NULL,
	"state" text NOT NULL,
	"failure" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_send_idempotencyKey_unique" UNIQUE("idempotencyKey"),
	CONSTRAINT "email_send_state" CHECK ("email_send"."state" in ('sent', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "import_link" (
	"id" text PRIMARY KEY NOT NULL,
	"sourceId" text NOT NULL,
	"kind" text NOT NULL,
	"sourceKey" text NOT NULL,
	"valenceId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_run" (
	"id" text PRIMARY KEY NOT NULL,
	"sourceId" text NOT NULL,
	"state" text DEFAULT 'planning' NOT NULL,
	"options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cursor" jsonb,
	"report" jsonb,
	"failure" jsonb,
	"jobId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"startedAt" timestamp,
	"finishedAt" timestamp,
	CONSTRAINT "import_run_state" CHECK ("import_run"."state" in ('planning', 'planned', 'importing', 'completed', 'failed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "import_source" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"token" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "import_source_kind" CHECK ("import_source"."kind" in ('jellyfin', 'emby', 'plex', 'radarr', 'sonarr', 'lidarr', 'prowlarr', 'overseerr', 'jellyseerr'))
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "displayUsername" text;--> statement-breakpoint
ALTER TABLE "watch_history" ADD COLUMN "importedFrom" text;--> statement-breakpoint
ALTER TABLE "watch_history" ADD COLUMN "importKey" text;--> statement-breakpoint
ALTER TABLE "account_setup_link" ADD CONSTRAINT "account_setup_link_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_setup_link" ADD CONSTRAINT "account_setup_link_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_entry" ADD CONSTRAINT "collection_entry_collectionId_collection_id_fk" FOREIGN KEY ("collectionId") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_entry" ADD CONSTRAINT "collection_entry_mediaItemId_media_item_id_fk" FOREIGN KEY ("mediaItemId") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_entry" ADD CONSTRAINT "collection_entry_seriesId_series_id_fk" FOREIGN KEY ("seriesId") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_link" ADD CONSTRAINT "import_link_sourceId_import_source_id_fk" FOREIGN KEY ("sourceId") REFERENCES "public"."import_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_run" ADD CONSTRAINT "import_run_sourceId_import_source_id_fk" FOREIGN KEY ("sourceId") REFERENCES "public"."import_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_setup_link_user_idx" ON "account_setup_link" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "collection_entry_item_idx" ON "collection_entry" USING btree ("collectionId","mediaItemId") WHERE "collection_entry"."mediaItemId" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "collection_entry_series_idx" ON "collection_entry" USING btree ("collectionId","seriesId") WHERE "collection_entry"."seriesId" is not null;--> statement-breakpoint
CREATE INDEX "collection_entry_order_idx" ON "collection_entry" USING btree ("collectionId","position");--> statement-breakpoint
CREATE INDEX "collection_entry_media_item_idx" ON "collection_entry" USING btree ("mediaItemId");--> statement-breakpoint
CREATE INDEX "collection_entry_series_id_idx" ON "collection_entry" USING btree ("seriesId");--> statement-breakpoint
CREATE INDEX "email_send_recent_idx" ON "email_send" USING btree ("createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "import_link_key_idx" ON "import_link" USING btree ("sourceId","kind","sourceKey");--> statement-breakpoint
CREATE INDEX "import_link_valence_idx" ON "import_link" USING btree ("kind","valenceId");--> statement-breakpoint
CREATE INDEX "import_run_source_idx" ON "import_run" USING btree ("sourceId","createdAt");--> statement-breakpoint
CREATE INDEX "import_run_state_idx" ON "import_run" USING btree ("state");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_importKey_unique" UNIQUE("importKey");