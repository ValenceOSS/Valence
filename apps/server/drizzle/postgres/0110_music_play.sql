CREATE TABLE "music_play" (
	"id" text PRIMARY KEY NOT NULL,
	"profileId" text NOT NULL,
	"trackId" text NOT NULL,
	"playedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "music_play" ADD CONSTRAINT "music_play_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_play" ADD CONSTRAINT "music_play_trackId_music_track_mediaItemId_fk" FOREIGN KEY ("trackId") REFERENCES "public"."music_track"("mediaItemId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "music_play_recent_idx" ON "music_play" USING btree ("profileId","playedAt");--> statement-breakpoint
CREATE INDEX "music_play_track_idx" ON "music_play" USING btree ("profileId","trackId");