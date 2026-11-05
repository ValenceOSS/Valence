CREATE TABLE "episode_pin" (
	"libraryId" text NOT NULL,
	"path" text NOT NULL,
	"seasonNumber" integer NOT NULL,
	"episodeNumber" integer NOT NULL,
	"episodeNumberEnd" integer,
	"setAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "episode_pin_libraryId_path_pk" PRIMARY KEY("libraryId","path")
);
--> statement-breakpoint
ALTER TABLE "series" ADD COLUMN "episodeOrder" text;--> statement-breakpoint
ALTER TABLE "series" ADD COLUMN "episodeTotal" integer;--> statement-breakpoint
ALTER TABLE "episode_pin" ADD CONSTRAINT "episode_pin_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;