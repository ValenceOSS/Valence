-- Uploads that come in piece by piece, kept here rather than in memory so that a server that
-- restarts part of the way through a film still knows which pieces it has, and the same file chosen
-- again carries on from them. The staging file each points at is hidden beside where it is going.
CREATE TABLE "upload_session" (
	"id" text PRIMARY KEY NOT NULL,
	"libraryId" text NOT NULL,
	"path" text NOT NULL,
	"destination" text NOT NULL,
	"staging" text NOT NULL,
	"bytes" bigint NOT NULL,
	"pieceBytes" integer NOT NULL,
	"pieces" integer NOT NULL,
	"received" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"touchedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "upload_session" ADD CONSTRAINT "upload_session_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "upload_session_touched_idx" ON "upload_session" USING btree ("touchedAt");