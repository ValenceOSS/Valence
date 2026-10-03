CREATE TABLE "link_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"codeHash" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"usedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "linked_server" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"colour" text NOT NULL,
	"address" text NOT NULL,
	"publicKey" jsonb NOT NULL,
	"fingerprint" text NOT NULL,
	"state" text NOT NULL,
	"theirPairingId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"linkedAt" timestamp,
	"lastSeenAt" timestamp,
	CONSTRAINT "linked_server_state" CHECK ("linked_server"."state" in ('awaitingThem', 'awaitingUs', 'linked', 'refused', 'unlinkedByThem'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "link_invite_code_idx" ON "link_invite" USING btree ("codeHash");--> statement-breakpoint
CREATE UNIQUE INDEX "linked_server_fingerprint_idx" ON "linked_server" USING btree ("fingerprint");