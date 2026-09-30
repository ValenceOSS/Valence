ALTER TABLE "playlist" DROP CONSTRAINT IF EXISTS "playlist_profileId_viewer_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "playlist_entry" DROP CONSTRAINT IF EXISTS "playlist_entry_mediaItemId_media_item_id_fk";
--> statement-breakpoint
ALTER TABLE "playlist" ALTER COLUMN "profileId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "playlist_entry" ALTER COLUMN "mediaItemId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_entry" ADD CONSTRAINT "playlist_entry_mediaItemId_media_item_id_fk" FOREIGN KEY ("mediaItemId") REFERENCES "public"."media_item"("id") ON DELETE set null ON UPDATE no action;