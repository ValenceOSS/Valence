-- Audiobooks, filed in book libraries beside the books they are read from. A book is still a folder
-- and each file in it a chapter; an audiobook's chapter is a track to listen to instead of pages to
-- read, so it says how long it lasts, and an m4b holding a whole book in one file carries the marks
-- where its own chapters begin. A book with nothing to read but something to hear is laid out as
-- audio.
ALTER TABLE "book" DROP CONSTRAINT IF EXISTS "book_layout_known";
--> statement-breakpoint
ALTER TABLE "book_chapter" DROP CONSTRAINT IF EXISTS "book_chapter_format_known";
--> statement-breakpoint
ALTER TABLE "book_chapter" ADD COLUMN IF NOT EXISTS "durationSeconds" real;
--> statement-breakpoint
ALTER TABLE "book_chapter" ADD COLUMN IF NOT EXISTS "marks" jsonb;
--> statement-breakpoint
ALTER TABLE "book" ADD CONSTRAINT "book_layout_known" CHECK ("book"."layout" in ('fixed', 'reflow', 'audio'));
--> statement-breakpoint
ALTER TABLE "book_chapter" ADD CONSTRAINT "book_chapter_format_known" CHECK ("book_chapter"."format" in ('cbz', 'cbr', 'pdf', 'epub', 'm4b', 'm4a', 'mp3', 'aac', 'ogg', 'opus', 'flac'));
