CREATE TABLE "calendar_feed" (
	"id" text PRIMARY KEY NOT NULL,
	"tokenHash" text NOT NULL,
	"sealedToken" text NOT NULL,
	"accountId" text NOT NULL,
	"profileId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastReadAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "calendar_feed" ADD CONSTRAINT "calendar_feed_accountId_user_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_feed" ADD CONSTRAINT "calendar_feed_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_feed_token_idx" ON "calendar_feed" USING btree ("tokenHash");--> statement-breakpoint
CREATE INDEX "calendar_feed_account_idx" ON "calendar_feed" USING btree ("accountId");