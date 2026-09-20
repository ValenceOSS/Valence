ALTER TABLE "valence_requests"."media_request" ALTER COLUMN "tmdb_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "music_brainz_id" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "artist_name" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD COLUMN "release_types" jsonb;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN "music_brainz_id" text;--> statement-breakpoint
ALTER TABLE "valence_requests"."media_request" ADD CONSTRAINT "media_request_music" UNIQUE("kind","music_brainz_id");--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD CONSTRAINT "request_item_album" UNIQUE("request_id","music_brainz_id");