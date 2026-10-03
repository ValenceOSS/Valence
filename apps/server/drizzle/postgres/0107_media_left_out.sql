CREATE TABLE "media_left_out" (
	"id" text PRIMARY KEY NOT NULL,
	"libraryId" text NOT NULL,
	"path" text NOT NULL,
	"isFolder" boolean DEFAULT false NOT NULL,
	"note" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" text
);
--> statement-breakpoint
ALTER TABLE "media_left_out" ADD CONSTRAINT "media_left_out_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "media_left_out_path_idx" ON "media_left_out" USING btree ("libraryId","path");--> statement-breakpoint
CREATE INDEX "media_left_out_library_idx" ON "media_left_out" USING btree ("libraryId");