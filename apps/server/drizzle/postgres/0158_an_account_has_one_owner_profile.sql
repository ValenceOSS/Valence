UPDATE "viewer_profile" SET "isOwner" = false WHERE "isOwner" = true AND "id" NOT IN (SELECT DISTINCT ON ("userId") "id" FROM "viewer_profile" WHERE "isOwner" = true ORDER BY "userId", "createdAt", "id");--> statement-breakpoint
ALTER TABLE "viewer_profile" ADD COLUMN "ownerOf" text GENERATED ALWAYS AS (case when "isOwner" then "userId" end) STORED;--> statement-breakpoint
CREATE UNIQUE INDEX "viewer_profile_owner_idx" ON "viewer_profile" USING btree ("ownerOf");
