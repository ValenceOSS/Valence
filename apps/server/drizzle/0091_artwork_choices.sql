-- Artwork an administrator chose for a title in place of the catalogue's own pick: one row per
-- library, catalogue title and kind of picture, kept apart from the files so a rescan keeps it.
CREATE TABLE "media_artwork_choice" (
	"id" text PRIMARY KEY NOT NULL,
	"libraryId" text NOT NULL,
	"externalKind" text NOT NULL,
	"externalId" text NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" text
);
--> statement-breakpoint
ALTER TABLE "media_artwork_choice" ADD CONSTRAINT "media_artwork_choice_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "media_artwork_choice_title_idx" ON "media_artwork_choice" USING btree ("libraryId","externalKind","externalId","kind");