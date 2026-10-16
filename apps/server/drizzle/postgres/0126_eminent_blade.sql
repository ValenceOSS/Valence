CREATE TABLE "child_account" (
	"userId" text PRIMARY KEY NOT NULL,
	"ownerId" text NOT NULL,
	"pinHash" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "child_account" ADD CONSTRAINT "child_account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_account" ADD CONSTRAINT "child_account_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "child_account_owner_idx" ON "child_account" USING btree ("ownerId");