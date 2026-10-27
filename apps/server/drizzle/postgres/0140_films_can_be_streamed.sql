CREATE TABLE "streamed_choice" (
	"mediaItemId" text PRIMARY KEY NOT NULL,
	"pluginId" text NOT NULL,
	"sourceId" text NOT NULL,
	"streamKey" text NOT NULL,
	"name" text NOT NULL,
	"infoHash" text,
	"fileName" text,
	"sizeBytes" bigint,
	"chosenAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library" ADD COLUMN "isStreamed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "streamed_choice" ADD CONSTRAINT "streamed_choice_mediaItemId_media_item_id_fk" FOREIGN KEY ("mediaItemId") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "role_permission" ("roleId", "permission")
SELECT "role"."id", 'sources.play'
FROM "role"
WHERE "role"."name" IN ('Member', 'Manager')
ON CONFLICT DO NOTHING;
