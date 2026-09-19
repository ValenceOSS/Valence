ALTER TABLE "library" ADD COLUMN IF NOT EXISTS "takesRequests" boolean NOT NULL DEFAULT true;
ALTER TABLE "library" ADD COLUMN IF NOT EXISTS "requestProfileId" text;
ALTER TABLE "library" ADD COLUMN IF NOT EXISTS "requestPath" text;
