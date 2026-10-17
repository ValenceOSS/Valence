CREATE TABLE "audit_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL,
	"actorId" text,
	"actorName" text NOT NULL,
	"action" text NOT NULL,
	"target" text,
	"detail" jsonb
);
--> statement-breakpoint
CREATE TABLE "play_record" (
	"id" text PRIMARY KEY NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL,
	"profileId" text,
	"mediaItemId" text NOT NULL,
	"mode" text NOT NULL,
	"reasons" jsonb NOT NULL,
	"client" text
);
--> statement-breakpoint
ALTER TABLE "audit_entry" ADD CONSTRAINT "audit_entry_actorId_user_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_record" ADD CONSTRAINT "play_record_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_record" ADD CONSTRAINT "play_record_mediaItemId_media_item_id_fk" FOREIGN KEY ("mediaItemId") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_entry_at_idx" ON "audit_entry" USING btree ("at");--> statement-breakpoint
CREATE INDEX "audit_entry_action_idx" ON "audit_entry" USING btree ("action","at");--> statement-breakpoint
CREATE INDEX "play_record_at_idx" ON "play_record" USING btree ("at");--> statement-breakpoint
CREATE INDEX "play_record_item_idx" ON "play_record" USING btree ("mediaItemId");