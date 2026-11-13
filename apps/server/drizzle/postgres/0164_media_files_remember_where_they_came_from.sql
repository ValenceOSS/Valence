CREATE TABLE "media_origin" (
	"libraryId" text NOT NULL,
	"path" text NOT NULL,
	"source" text NOT NULL,
	"via" text,
	"recordedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_origin_source" CHECK ("media_origin"."source" in ('upload', 'import'))
);
--> statement-breakpoint
ALTER TABLE "media_origin" ADD CONSTRAINT "media_origin_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "media_origin_path_idx" ON "media_origin" USING btree ("libraryId","path");