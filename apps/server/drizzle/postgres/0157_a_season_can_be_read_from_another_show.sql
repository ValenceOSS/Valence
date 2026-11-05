CREATE TABLE "season_source" (
	"seriesId" text NOT NULL,
	"seasonNumber" integer NOT NULL,
	"externalId" text NOT NULL,
	"externalSeason" integer NOT NULL,
	"title" text NOT NULL,
	"year" integer,
	"setAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "season_source" ADD CONSTRAINT "season_source_seriesId_series_id_fk" FOREIGN KEY ("seriesId") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "season_source_season_idx" ON "season_source" USING btree ("seriesId","seasonNumber");