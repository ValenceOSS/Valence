CREATE TABLE "reading_bookmark" (
	"id" text PRIMARY KEY NOT NULL,
	"profileId" text NOT NULL,
	"bookId" text NOT NULL,
	"chapterId" text NOT NULL,
	"pageNumber" integer,
	"fraction" real,
	"pageShown" integer,
	"excerpt" text,
	"picture" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reading_bookmark_somewhere" CHECK ("reading_bookmark"."pageNumber" is not null or "reading_bookmark"."fraction" is not null)
);
--> statement-breakpoint
ALTER TABLE "reading_bookmark" ADD CONSTRAINT "reading_bookmark_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_bookmark" ADD CONSTRAINT "reading_bookmark_bookId_book_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_bookmark" ADD CONSTRAINT "reading_bookmark_chapterId_book_chapter_id_fk" FOREIGN KEY ("chapterId") REFERENCES "public"."book_chapter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reading_bookmark_book_id_idx" ON "reading_bookmark" USING btree ("bookId");--> statement-breakpoint
CREATE INDEX "reading_bookmark_chapter_idx" ON "reading_bookmark" USING btree ("chapterId");--> statement-breakpoint
CREATE INDEX "reading_bookmark_book_idx" ON "reading_bookmark" USING btree ("profileId","bookId");