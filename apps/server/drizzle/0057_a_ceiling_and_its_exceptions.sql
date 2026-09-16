CREATE TABLE "age_ceiling" (
	"userId" text NOT NULL,
	"libraryId" text NOT NULL,
	"maximumAge" integer NOT NULL,
	"allowsUnrated" boolean DEFAULT false NOT NULL,
	"setAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "age_ceiling_userId_libraryId_pk" PRIMARY KEY("userId","libraryId"),
	CONSTRAINT "age_ceiling_range" CHECK ("age_ceiling"."maximumAge" between 0 and 21)
);
--> statement-breakpoint
CREATE TABLE "age_exception" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"mediaItemId" text,
	"seriesId" text,
	"effect" text NOT NULL,
	"grantedBy" text,
	"grantedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "age_exception_one_subject" CHECK (num_nonnulls("age_exception"."mediaItemId", "age_exception"."seriesId") = 1),
	CONSTRAINT "age_exception_effect" CHECK ("age_exception"."effect" in ('allow', 'deny'))
);
--> statement-breakpoint
ALTER TABLE "age_ceiling" ADD CONSTRAINT "age_ceiling_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "age_ceiling" ADD CONSTRAINT "age_ceiling_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "age_exception" ADD CONSTRAINT "age_exception_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "age_exception" ADD CONSTRAINT "age_exception_mediaItemId_media_item_id_fk" FOREIGN KEY ("mediaItemId") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "age_exception" ADD CONSTRAINT "age_exception_seriesId_series_id_fk" FOREIGN KEY ("seriesId") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "age_exception" ADD CONSTRAINT "age_exception_grantedBy_user_id_fk" FOREIGN KEY ("grantedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "age_ceiling_library_idx" ON "age_ceiling" USING btree ("libraryId");--> statement-breakpoint
CREATE UNIQUE INDEX "age_exception_item_idx" ON "age_exception" USING btree ("userId","mediaItemId") WHERE "age_exception"."mediaItemId" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "age_exception_series_idx" ON "age_exception" USING btree ("userId","seriesId") WHERE "age_exception"."seriesId" is not null;--> statement-breakpoint
CREATE INDEX "age_exception_subject_item_idx" ON "age_exception" USING btree ("mediaItemId");--> statement-breakpoint
CREATE INDEX "age_exception_subject_series_idx" ON "age_exception" USING btree ("seriesId");