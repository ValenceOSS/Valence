ALTER TABLE "music_album" ADD COLUMN "lookedUpAt" timestamp;--> statement-breakpoint
ALTER TABLE "music_artist" ADD COLUMN "lookedUpAt" timestamp;--> statement-breakpoint
ALTER TABLE "music_track" ADD COLUMN "lyricsLookedUpAt" timestamp;--> statement-breakpoint
ALTER TABLE "music_track" ADD COLUMN "videoKey" text;