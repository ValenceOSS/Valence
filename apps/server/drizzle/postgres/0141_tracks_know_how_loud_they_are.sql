ALTER TABLE "music_track" ADD COLUMN "trackGainDb" double precision;--> statement-breakpoint
ALTER TABLE "music_track" ADD COLUMN "trackPeak" double precision;--> statement-breakpoint
ALTER TABLE "music_track" ADD COLUMN "albumGainDb" double precision;--> statement-breakpoint
ALTER TABLE "music_track" ADD COLUMN "albumPeak" double precision;--> statement-breakpoint
ALTER TABLE "music_track" ADD COLUMN "loudnessTriedAt" timestamp;