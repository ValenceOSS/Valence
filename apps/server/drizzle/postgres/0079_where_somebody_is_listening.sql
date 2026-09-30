-- Where somebody is in an audiobook, beside where they are in the book it is read from. One place
-- a book rather than a chapter, since listening carries on from track to track, and a time rather
-- than a page, so reading_progress's rule that a place is a page or a fraction does not bend to it.
-- A profile's places go with the profile.
CREATE TABLE IF NOT EXISTS "listening_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"profileId" text NOT NULL,
	"bookId" text NOT NULL,
	"chapterId" text NOT NULL,
	"positionSeconds" real NOT NULL,
	"isFinished" boolean DEFAULT false NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listening_progress" ADD CONSTRAINT "listening_progress_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "listening_progress" ADD CONSTRAINT "listening_progress_bookId_book_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."book"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "listening_progress" ADD CONSTRAINT "listening_progress_chapterId_book_chapter_id_fk" FOREIGN KEY ("chapterId") REFERENCES "public"."book_chapter"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "listening_progress_book_idx" ON "listening_progress" USING btree ("profileId","bookId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listening_progress_recent_idx" ON "listening_progress" USING btree ("profileId","updatedAt");