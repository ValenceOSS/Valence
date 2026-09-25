-- The last episode a file holds where it holds more than one, as a double episode filed as
-- `S01E01-E02` does, so the second is known to be here rather than shown as missing. Nothing to
-- backfill, since the next scan reads it.
ALTER TABLE "media_item" ADD COLUMN "episodeNumberEnd" integer;
