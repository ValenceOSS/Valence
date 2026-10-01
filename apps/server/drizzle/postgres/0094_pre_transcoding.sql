CREATE TABLE "pre_transcode_refusal" (
	"mediaItemId" text PRIMARY KEY NOT NULL,
	"target" text NOT NULL,
	"code" text NOT NULL,
	"detail" jsonb NOT NULL,
	"refusedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reencode_request" ADD COLUMN "container" text;--> statement-breakpoint
ALTER TABLE "reencode_request" ADD COLUMN "maxBitrateKbps" integer;--> statement-breakpoint
ALTER TABLE "reencode_request" ADD COLUMN "placement" text DEFAULT 'hidden' NOT NULL;--> statement-breakpoint
ALTER TABLE "reencode_request" ADD COLUMN "origin" text DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "pre_transcode_refusal" ADD CONSTRAINT "pre_transcode_refusal_mediaItemId_media_item_id_fk" FOREIGN KEY ("mediaItemId") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reencode_request_origin_idx" ON "reencode_request" USING btree ("origin","state");--> statement-breakpoint
ALTER TABLE "reencode_request" ADD CONSTRAINT "reencode_request_container" CHECK ("reencode_request"."container" in ('mp4', 'mkv'));--> statement-breakpoint
ALTER TABLE "reencode_request" ADD CONSTRAINT "reencode_request_placement" CHECK ("reencode_request"."placement" in ('hidden', 'beside'));--> statement-breakpoint
ALTER TABLE "reencode_request" ADD CONSTRAINT "reencode_request_origin" CHECK ("reencode_request"."origin" in ('admin', 'preTranscode'));