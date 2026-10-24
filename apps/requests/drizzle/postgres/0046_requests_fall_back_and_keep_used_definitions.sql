ALTER TABLE "valence_requests"."indexer_definition" ADD COLUMN "is_upstream" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "valence_requests"."quality_profile" ADD COLUMN "is_fallback" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "valence_requests"."quality_profile" SET "is_fallback" = true WHERE "id" IN (SELECT DISTINCT ON ("kind") "id" FROM "valence_requests"."quality_profile" ORDER BY "kind", "position", "name");
