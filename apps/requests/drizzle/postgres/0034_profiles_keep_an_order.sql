ALTER TABLE "valence_requests"."media_request" ADD COLUMN "profile_ask" jsonb;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "valence_requests"."quality_profile" AS "profile" SET "position" = "ranked"."place" FROM (SELECT "id", (row_number() OVER (ORDER BY "created_at", "name") - 1)::integer AS "place" FROM "valence_requests"."quality_profile") AS "ranked" WHERE "profile"."id" = "ranked"."id";
