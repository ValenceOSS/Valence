CREATE TABLE "media_rendition" (
	"id" text PRIMARY KEY NOT NULL,
	"mediaItemId" text NOT NULL,
	"kind" text DEFAULT 'pinned' NOT NULL,
	"path" text NOT NULL,
	"label" text NOT NULL,
	"quality" text,
	"sizeBytes" bigint NOT NULL,
	"container" text NOT NULL,
	"durationSeconds" real NOT NULL,
	"bitrateKbps" integer NOT NULL,
	"videoCodec" text NOT NULL,
	"videoRange" text NOT NULL,
	"videoRangeBase" text,
	"videoBitDepth" integer,
	"canCopySegments" boolean,
	"videoLevel" integer,
	"videoFrameRate" real,
	"videoIsInterlaced" boolean,
	"videoRefFrames" integer,
	"videoPixelAspect" text,
	"videoRotationDegrees" integer,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"audioStreams" jsonb NOT NULL,
	"subtitleStreams" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" text,
	CONSTRAINT "media_rendition_kind" CHECK ("media_rendition"."kind" in ('pinned'))
);
--> statement-breakpoint
CREATE TABLE "reencode_request" (
	"id" text PRIMARY KEY NOT NULL,
	"mediaItemId" text NOT NULL,
	"libraryId" text NOT NULL,
	"mode" text NOT NULL,
	"state" text DEFAULT 'queued' NOT NULL,
	"quality" text,
	"videoCodec" text,
	"audio" text NOT NULL,
	"originalPath" text NOT NULL,
	"originalSizeBytes" bigint NOT NULL,
	"originalProbe" jsonb NOT NULL,
	"workingPath" text NOT NULL,
	"asidePath" text,
	"renditionId" text,
	"samplePath" text,
	"estimatedBytes" bigint,
	"producedBytes" bigint,
	"progress" integer DEFAULT 0 NOT NULL,
	"bytesPerSecond" bigint,
	"failure" text,
	"askedBy" text,
	"askedAt" timestamp DEFAULT now() NOT NULL,
	"startedAt" timestamp,
	"encodedAt" timestamp,
	"reviewedAt" timestamp,
	CONSTRAINT "reencode_request_mode" CHECK ("reencode_request"."mode" in ('replace', 'keep', 'audioOnly')),
	CONSTRAINT "reencode_request_state" CHECK ("reencode_request"."state" in ('queued', 'encoding', 'verifying', 'awaitingReview', 'finished', 'rejected', 'failed', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "media_rendition" ADD CONSTRAINT "media_rendition_mediaItemId_media_item_id_fk" FOREIGN KEY ("mediaItemId") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reencode_request" ADD CONSTRAINT "reencode_request_mediaItemId_media_item_id_fk" FOREIGN KEY ("mediaItemId") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reencode_request" ADD CONSTRAINT "reencode_request_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "media_rendition_path_idx" ON "media_rendition" USING btree ("path");--> statement-breakpoint
CREATE INDEX "media_rendition_item_idx" ON "media_rendition" USING btree ("mediaItemId");--> statement-breakpoint
CREATE INDEX "reencode_request_state_idx" ON "reencode_request" USING btree ("state","askedAt");--> statement-breakpoint
CREATE INDEX "reencode_request_item_idx" ON "reencode_request" USING btree ("mediaItemId");--> statement-breakpoint
CREATE INDEX "reencode_request_library_idx" ON "reencode_request" USING btree ("libraryId");
