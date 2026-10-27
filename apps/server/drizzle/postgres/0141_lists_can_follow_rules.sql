ALTER TABLE "collection" ADD COLUMN "profileId" text;--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN "isShared" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN "rules" jsonb;--> statement-breakpoint
ALTER TABLE "playlist" ADD COLUMN "rules" jsonb;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collection_owner_idx" ON "collection" USING btree ("profileId");