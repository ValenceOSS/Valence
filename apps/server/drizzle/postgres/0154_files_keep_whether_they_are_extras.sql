CREATE TABLE "extra_choice" (
	"libraryId" text NOT NULL,
	"path" text NOT NULL,
	"extraKind" text,
	"parentPath" text,
	"setAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "extra_choice_libraryId_path_pk" PRIMARY KEY("libraryId","path")
);
--> statement-breakpoint
ALTER TABLE "extra_choice" ADD CONSTRAINT "extra_choice_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;