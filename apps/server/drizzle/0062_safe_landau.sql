CREATE TABLE "media_preview_override" (
	"id" text PRIMARY KEY NOT NULL,
	"libraryId" text NOT NULL,
	"path" text NOT NULL,
	"atSeconds" integer NOT NULL,
	"durationSeconds" integer,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" text
);
--> statement-breakpoint
ALTER TABLE "media_preview_override" ADD CONSTRAINT "media_preview_override_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "media_preview_override_path_idx" ON "media_preview_override" USING btree ("libraryId","path");--> statement-breakpoint
CREATE INDEX "media_preview_override_library_idx" ON "media_preview_override" USING btree ("libraryId");