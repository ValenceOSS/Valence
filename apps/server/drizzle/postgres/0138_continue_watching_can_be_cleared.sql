CREATE TABLE "continue_watching_dismissal" (
	"profileId" text NOT NULL,
	"mediaItemId" text NOT NULL,
	"dismissedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "continue_watching_dismissal_profileId_mediaItemId_pk" PRIMARY KEY("profileId","mediaItemId")
);
--> statement-breakpoint
ALTER TABLE "continue_watching_dismissal" ADD CONSTRAINT "continue_watching_dismissal_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "continue_watching_dismissal" ADD CONSTRAINT "continue_watching_dismissal_mediaItemId_media_item_id_fk" FOREIGN KEY ("mediaItemId") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "continue_watching_dismissal_media_item_idx" ON "continue_watching_dismissal" USING btree ("mediaItemId");