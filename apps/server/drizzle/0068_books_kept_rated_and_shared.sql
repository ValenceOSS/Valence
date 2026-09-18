ALTER TABLE "rating" DROP CONSTRAINT "rating_one_subject";--> statement-breakpoint
ALTER TABLE "share" DROP CONSTRAINT "share_one_subject";--> statement-breakpoint
ALTER TABLE "share" DROP CONSTRAINT "share_kind";--> statement-breakpoint
ALTER TABLE "favourite" ALTER COLUMN "mediaItemId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "favourite" ADD COLUMN "bookId" text;--> statement-breakpoint
ALTER TABLE "rating" ADD COLUMN "bookId" text;--> statement-breakpoint
ALTER TABLE "share" ADD COLUMN "bookId" text;--> statement-breakpoint
ALTER TABLE "favourite" ADD CONSTRAINT "favourite_bookId_book_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating" ADD CONSTRAINT "rating_bookId_book_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share" ADD CONSTRAINT "share_bookId_book_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "favourite_profile_book_idx" ON "favourite" USING btree ("profileId","bookId") WHERE "favourite"."bookId" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "rating_profile_book_idx" ON "rating" USING btree ("profileId","bookId") WHERE "rating"."bookId" is not null;--> statement-breakpoint
CREATE INDEX "rating_book_idx" ON "rating" USING btree ("bookId");--> statement-breakpoint
ALTER TABLE "favourite" ADD CONSTRAINT "favourite_one_subject" CHECK (num_nonnulls("favourite"."mediaItemId", "favourite"."bookId") = 1);--> statement-breakpoint
ALTER TABLE "rating" ADD CONSTRAINT "rating_one_subject" CHECK (num_nonnulls("rating"."mediaItemId", "rating"."seriesId", "rating"."bookId") = 1);--> statement-breakpoint
ALTER TABLE "share" ADD CONSTRAINT "share_one_subject" CHECK (num_nonnulls("share"."mediaItemId", "share"."seriesId", "share"."bookId") = 1);--> statement-breakpoint
ALTER TABLE "share" ADD CONSTRAINT "share_kind" CHECK ("share"."kind" in ('item', 'series', 'book'));