-- Which series of books a book is one of, and where it comes: a saga of novels kept as books of
-- their own, read from the book's package or from its folders. Nothing to backfill, since the next
-- scan reads it.
ALTER TABLE "book" ADD COLUMN IF NOT EXISTS "seriesName" text;--> statement-breakpoint
ALTER TABLE "book" ADD COLUMN IF NOT EXISTS "seriesPosition" real;
