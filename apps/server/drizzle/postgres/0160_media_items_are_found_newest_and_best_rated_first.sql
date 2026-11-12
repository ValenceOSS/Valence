CREATE INDEX "media_item_added_at_idx" ON "media_item" USING btree ("addedAt");--> statement-breakpoint
CREATE INDEX "media_item_rating_idx" ON "media_item" USING btree ("rating" DESC NULLS LAST);