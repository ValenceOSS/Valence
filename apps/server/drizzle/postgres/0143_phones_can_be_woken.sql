CREATE TABLE "phone_push" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"profileId" text,
	"platform" text NOT NULL,
	"token" text NOT NULL,
	"environment" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phone_push" ADD CONSTRAINT "phone_push_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_push" ADD CONSTRAINT "phone_push_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "phone_push_token_idx" ON "phone_push" USING btree ("token");--> statement-breakpoint
CREATE INDEX "phone_push_user_idx" ON "phone_push" USING btree ("userId");