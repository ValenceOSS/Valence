ALTER TABLE "media_item" ADD COLUMN "videoCodecTag" text;--> statement-breakpoint
ALTER TABLE "media_rendition" ADD COLUMN "videoCodecTag" text;
