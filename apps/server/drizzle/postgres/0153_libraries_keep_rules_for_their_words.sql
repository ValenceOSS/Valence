CREATE TABLE "word_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"libraryId" text NOT NULL,
	"field" text NOT NULL,
	"find" text NOT NULL,
	"replace" text NOT NULL,
	"setAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "word_rule" ADD CONSTRAINT "word_rule_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "word_rule_library_idx" ON "word_rule" USING btree ("libraryId");