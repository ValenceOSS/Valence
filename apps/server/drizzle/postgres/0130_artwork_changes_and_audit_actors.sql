ALTER TABLE "media_item" ADD COLUMN "artworkChangedAt" timestamp;--> statement-breakpoint
CREATE INDEX "audit_entry_actor_idx" ON "audit_entry" USING btree ("actorId","at");