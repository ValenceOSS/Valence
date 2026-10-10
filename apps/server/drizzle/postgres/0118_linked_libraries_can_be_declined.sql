CREATE TABLE "link_decline" (
	"linkedServerId" text NOT NULL,
	"libraryId" text NOT NULL,
	"declinedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "link_decline_linkedServerId_libraryId_pk" PRIMARY KEY("linkedServerId","libraryId")
);
--> statement-breakpoint
ALTER TABLE "link_decline" ADD CONSTRAINT "link_decline_linkedServerId_linked_server_id_fk" FOREIGN KEY ("linkedServerId") REFERENCES "public"."linked_server"("id") ON DELETE cascade ON UPDATE no action;