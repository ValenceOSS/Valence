ALTER TABLE "valence_requests"."media_request" ADD COLUMN "book_formats" jsonb;--> statement-breakpoint
ALTER TABLE "valence_requests"."request_item" ADD COLUMN "format" text;--> statement-breakpoint
UPDATE "valence_requests"."media_request" SET "book_formats" = '["ebook"]'::jsonb WHERE "kind" = 'book';--> statement-breakpoint
UPDATE "valence_requests"."request_item" SET "format" = 'ebook' WHERE "request_id" IN (SELECT "id" FROM "valence_requests"."media_request" WHERE "kind" = 'book');
