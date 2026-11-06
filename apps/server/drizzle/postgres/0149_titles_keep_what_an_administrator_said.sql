CREATE TABLE "title_change" (
	"id" text PRIMARY KEY NOT NULL,
	"changeSetId" text NOT NULL,
	"libraryId" text NOT NULL,
	"subjectKey" text NOT NULL,
	"subjectKind" text NOT NULL,
	"field" text NOT NULL,
	"before" jsonb NOT NULL,
	"after" jsonb NOT NULL,
	"action" text NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL,
	"actorId" text,
	"actorName" text
);
--> statement-breakpoint
CREATE TABLE "title_edit" (
	"id" text PRIMARY KEY NOT NULL,
	"libraryId" text NOT NULL,
	"subjectKey" text NOT NULL,
	"subjectKind" text NOT NULL,
	"field" text NOT NULL,
	"value" jsonb,
	"providerValue" jsonb,
	"providerChangedAt" timestamp,
	"source" text DEFAULT 'admin' NOT NULL,
	"setAt" timestamp DEFAULT now() NOT NULL,
	"setBy" text
);
--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "sortTitle" text;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "originalTitle" text;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "seriesSortTitle" text;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "studios" jsonb;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "networks" jsonb;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "externalKind" text;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "catalogueEpisodeId" text;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "tvdbId" text;--> statement-breakpoint
ALTER TABLE "title_change" ADD CONSTRAINT "title_change_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_change" ADD CONSTRAINT "title_change_actorId_user_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_edit" ADD CONSTRAINT "title_edit_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_edit" ADD CONSTRAINT "title_edit_setBy_user_id_fk" FOREIGN KEY ("setBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "title_change_subject_idx" ON "title_change" USING btree ("libraryId","subjectKey","at");--> statement-breakpoint
CREATE INDEX "title_change_set_idx" ON "title_change" USING btree ("changeSetId");--> statement-breakpoint
CREATE UNIQUE INDEX "title_edit_field_idx" ON "title_edit" USING btree ("libraryId","subjectKey","field","source");--> statement-breakpoint
CREATE INDEX "title_edit_subject_idx" ON "title_edit" USING btree ("libraryId","subjectKey");