ALTER TABLE "media_item" ADD COLUMN IF NOT EXISTS "releaseDate" text;
ALTER TABLE "media_item" ADD COLUMN IF NOT EXISTS "budget" bigint;
ALTER TABLE "media_item" ADD COLUMN IF NOT EXISTS "revenue" bigint;
ALTER TABLE "media_item" ADD COLUMN IF NOT EXISTS "catalogueStatus" text;
ALTER TABLE "media_item" ADD COLUMN IF NOT EXISTS "imdbId" text;
