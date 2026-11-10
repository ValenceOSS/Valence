CREATE TABLE "valence_requests"."annas_book" (
	"md5" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"language" text NOT NULL,
	"extension" text NOT NULL,
	"size_bytes" double precision,
	"year" integer,
	"cover_url" text,
	"torrent_group" text NOT NULL,
	"torrent" text NOT NULL,
	"file_in_torrent" text NOT NULL,
	"search_key" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "annas_book_search" ON "valence_requests"."annas_book" USING gin (to_tsvector('simple', "search_key"));