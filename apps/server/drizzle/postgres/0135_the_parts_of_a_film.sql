CREATE TABLE "media_part" (
	"mediaItemId" text NOT NULL,
	"position" integer NOT NULL,
	"path" text NOT NULL,
	"sizeBytes" bigint NOT NULL,
	"modifiedAtMs" bigint NOT NULL,
	"durationSeconds" real NOT NULL,
	CONSTRAINT "media_part_mediaItemId_position_pk" PRIMARY KEY("mediaItemId","position")
);
--> statement-breakpoint
ALTER TABLE "media_part" ADD CONSTRAINT "media_part_mediaItemId_media_item_id_fk" FOREIGN KEY ("mediaItemId") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_part_path_idx" ON "media_part" USING btree ("path");