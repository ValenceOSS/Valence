CREATE TABLE "federation_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"linkedServerId" text NOT NULL,
	"remotePersonId" text,
	"action" text NOT NULL,
	"mediaId" text,
	"mediaTitle" text,
	"outcome" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"sameEventKey" text NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_grant" (
	"linkedServerId" text NOT NULL,
	"libraryId" text NOT NULL,
	"grantedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "link_grant_linkedServerId_libraryId_pk" PRIMARY KEY("linkedServerId","libraryId")
);
--> statement-breakpoint
CREATE TABLE "remote_person" (
	"id" text PRIMARY KEY NOT NULL,
	"linkedServerId" text NOT NULL,
	"pseudonym" text NOT NULL,
	"name" text,
	"firstSeenAt" timestamp DEFAULT now() NOT NULL,
	"lastSeenAt" timestamp DEFAULT now() NOT NULL,
	"blockedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "linked_server" ADD COLUMN "maximumAge" integer;--> statement-breakpoint
ALTER TABLE "linked_server" ADD COLUMN "allowsUnrated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "linked_server" ADD COLUMN "namesTravel" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "linked_server" ADD COLUMN "showsActivity" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "federation_audit" ADD CONSTRAINT "federation_audit_linkedServerId_linked_server_id_fk" FOREIGN KEY ("linkedServerId") REFERENCES "public"."linked_server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federation_audit" ADD CONSTRAINT "federation_audit_remotePersonId_remote_person_id_fk" FOREIGN KEY ("remotePersonId") REFERENCES "public"."remote_person"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_grant" ADD CONSTRAINT "link_grant_linkedServerId_linked_server_id_fk" FOREIGN KEY ("linkedServerId") REFERENCES "public"."linked_server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_grant" ADD CONSTRAINT "link_grant_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_person" ADD CONSTRAINT "remote_person_linkedServerId_linked_server_id_fk" FOREIGN KEY ("linkedServerId") REFERENCES "public"."linked_server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "federation_audit_server_idx" ON "federation_audit" USING btree ("linkedServerId","at");--> statement-breakpoint
CREATE INDEX "federation_audit_same_event_idx" ON "federation_audit" USING btree ("sameEventKey","at");--> statement-breakpoint
CREATE INDEX "link_grant_library_idx" ON "link_grant" USING btree ("libraryId");--> statement-breakpoint
CREATE UNIQUE INDEX "remote_person_pseudonym_idx" ON "remote_person" USING btree ("linkedServerId","pseudonym");