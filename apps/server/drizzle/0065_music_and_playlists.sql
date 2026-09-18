CREATE TABLE "favourite_artist" (
	"profileId" text NOT NULL,
	"artistId" text NOT NULL,
	"keptAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favourite_artist_profileId_artistId_pk" PRIMARY KEY("profileId","artistId")
);
--> statement-breakpoint
CREATE TABLE "music_album" (
	"id" text PRIMARY KEY NOT NULL,
	"libraryId" text NOT NULL,
	"artistId" text NOT NULL,
	"title" text NOT NULL,
	"titleKey" text NOT NULL,
	"year" integer,
	"genres" jsonb,
	"isCompilation" boolean DEFAULT false NOT NULL,
	"artworkPath" text,
	"musicbrainzId" text,
	"lookedUpAt" timestamp,
	"addedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_artist" (
	"id" text PRIMARY KEY NOT NULL,
	"libraryId" text NOT NULL,
	"name" text NOT NULL,
	"nameKey" text NOT NULL,
	"sortName" text NOT NULL,
	"musicbrainzId" text,
	"imagePath" text,
	"lookedUpAt" timestamp,
	"addedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_track" (
	"mediaItemId" text PRIMARY KEY NOT NULL,
	"albumId" text NOT NULL,
	"discNumber" integer,
	"trackNumber" integer,
	"codec" text NOT NULL,
	"isLossless" boolean DEFAULT false NOT NULL,
	"isExplicit" boolean DEFAULT false NOT NULL,
	"bitDepth" integer,
	"sampleRate" integer,
	"lyrics" text,
	"lyricsAreSynced" boolean DEFAULT false NOT NULL,
	"lyricsModifiedAtMs" bigint,
	"lyricsLookedUpAt" timestamp,
	"videoKey" text
);
--> statement-breakpoint
CREATE TABLE "music_track_artist" (
	"mediaItemId" text NOT NULL,
	"artistId" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "music_track_artist_mediaItemId_artistId_pk" PRIMARY KEY("mediaItemId","artistId")
);
--> statement-breakpoint
CREATE TABLE "playlist" (
	"id" text PRIMARY KEY NOT NULL,
	"profileId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"isShared" boolean DEFAULT false NOT NULL,
	"isOrdered" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlist_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"playlistId" text NOT NULL,
	"mediaItemId" text NOT NULL,
	"position" double precision NOT NULL,
	"addedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "favourite_artist" ADD CONSTRAINT "favourite_artist_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourite_artist" ADD CONSTRAINT "favourite_artist_artistId_music_artist_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."music_artist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_album" ADD CONSTRAINT "music_album_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_album" ADD CONSTRAINT "music_album_artistId_music_artist_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."music_artist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_artist" ADD CONSTRAINT "music_artist_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_track" ADD CONSTRAINT "music_track_mediaItemId_media_item_id_fk" FOREIGN KEY ("mediaItemId") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_track" ADD CONSTRAINT "music_track_albumId_music_album_id_fk" FOREIGN KEY ("albumId") REFERENCES "public"."music_album"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_track_artist" ADD CONSTRAINT "music_track_artist_mediaItemId_media_item_id_fk" FOREIGN KEY ("mediaItemId") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_track_artist" ADD CONSTRAINT "music_track_artist_artistId_music_artist_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."music_artist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_entry" ADD CONSTRAINT "playlist_entry_playlistId_playlist_id_fk" FOREIGN KEY ("playlistId") REFERENCES "public"."playlist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_entry" ADD CONSTRAINT "playlist_entry_mediaItemId_media_item_id_fk" FOREIGN KEY ("mediaItemId") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "favourite_artist_recent_idx" ON "favourite_artist" USING btree ("profileId","keptAt");--> statement-breakpoint
CREATE UNIQUE INDEX "music_album_key_idx" ON "music_album" USING btree ("libraryId","artistId","titleKey");--> statement-breakpoint
CREATE INDEX "music_album_recent_idx" ON "music_album" USING btree ("libraryId","addedAt");--> statement-breakpoint
CREATE INDEX "music_album_artist_idx" ON "music_album" USING btree ("artistId");--> statement-breakpoint
CREATE UNIQUE INDEX "music_artist_key_idx" ON "music_artist" USING btree ("libraryId","nameKey");--> statement-breakpoint
CREATE INDEX "music_artist_sort_idx" ON "music_artist" USING btree ("libraryId","sortName");--> statement-breakpoint
CREATE INDEX "music_track_album_idx" ON "music_track" USING btree ("albumId","discNumber","trackNumber");--> statement-breakpoint
CREATE INDEX "music_track_artist_artist_idx" ON "music_track_artist" USING btree ("artistId");--> statement-breakpoint
CREATE INDEX "playlist_owner_idx" ON "playlist" USING btree ("profileId","updatedAt");--> statement-breakpoint
CREATE INDEX "playlist_shared_idx" ON "playlist" USING btree ("isShared");--> statement-breakpoint
CREATE INDEX "playlist_entry_order_idx" ON "playlist_entry" USING btree ("playlistId","position");