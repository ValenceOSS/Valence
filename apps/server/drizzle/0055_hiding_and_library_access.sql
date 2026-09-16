CREATE TABLE "hidden" (
	"id" text PRIMARY KEY NOT NULL,
	"profileId" text NOT NULL,
	"mediaItemId" text,
	"seriesId" text,
	"libraryId" text,
	"hiddenAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hidden_one_subject" CHECK (num_nonnulls("hidden"."mediaItemId", "hidden"."seriesId", "hidden"."libraryId") = 1)
);
--> statement-breakpoint
CREATE TABLE "library_block" (
	"userId" text NOT NULL,
	"libraryId" text NOT NULL,
	"blockedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "library_block_userId_libraryId_pk" PRIMARY KEY("userId","libraryId")
);
--> statement-breakpoint
ALTER TABLE "hidden" ADD CONSTRAINT "hidden_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hidden" ADD CONSTRAINT "hidden_mediaItemId_media_item_id_fk" FOREIGN KEY ("mediaItemId") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hidden" ADD CONSTRAINT "hidden_seriesId_series_id_fk" FOREIGN KEY ("seriesId") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hidden" ADD CONSTRAINT "hidden_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_block" ADD CONSTRAINT "library_block_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_block" ADD CONSTRAINT "library_block_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hidden_profile_item_idx" ON "hidden" USING btree ("profileId","mediaItemId") WHERE "hidden"."mediaItemId" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "hidden_profile_series_idx" ON "hidden" USING btree ("profileId","seriesId") WHERE "hidden"."seriesId" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "hidden_profile_library_idx" ON "hidden" USING btree ("profileId","libraryId") WHERE "hidden"."libraryId" is not null;--> statement-breakpoint
CREATE INDEX "hidden_item_idx" ON "hidden" USING btree ("mediaItemId");--> statement-breakpoint
CREATE INDEX "hidden_series_idx" ON "hidden" USING btree ("seriesId");--> statement-breakpoint
CREATE INDEX "hidden_library_idx" ON "hidden" USING btree ("libraryId");--> statement-breakpoint
CREATE INDEX "library_block_library_idx" ON "library_block" USING btree ("libraryId");