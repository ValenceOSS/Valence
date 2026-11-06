CREATE TABLE "version_choice" (
	"libraryId" text NOT NULL,
	"path" text NOT NULL,
	"label" text,
	"isStanding" boolean DEFAULT false NOT NULL,
	"setAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "version_choice_libraryId_path_pk" PRIMARY KEY("libraryId","path")
);
--> statement-breakpoint
ALTER TABLE "version_choice" ADD CONSTRAINT "version_choice_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;