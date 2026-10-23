CREATE INDEX "download_holding_media_item_idx" ON "download_holding" USING btree ("mediaItemId");--> statement-breakpoint
CREATE INDEX "favourite_media_item_idx" ON "favourite" USING btree ("mediaItemId");--> statement-breakpoint
CREATE INDEX "favourite_book_id_idx" ON "favourite" USING btree ("bookId");--> statement-breakpoint
CREATE INDEX "favourite_artist_artist_idx" ON "favourite_artist" USING btree ("artistId");--> statement-breakpoint
CREATE INDEX "listening_progress_book_id_idx" ON "listening_progress" USING btree ("bookId");--> statement-breakpoint
CREATE INDEX "listening_progress_chapter_idx" ON "listening_progress" USING btree ("chapterId");--> statement-breakpoint
CREATE INDEX "music_play_track_id_idx" ON "music_play" USING btree ("trackId");--> statement-breakpoint
CREATE INDEX "playlist_entry_media_item_idx" ON "playlist_entry" USING btree ("mediaItemId");--> statement-breakpoint
CREATE INDEX "prepared_download_media_item_idx" ON "prepared_download" USING btree ("mediaItemId");--> statement-breakpoint
CREATE INDEX "reading_progress_book_id_idx" ON "reading_progress" USING btree ("bookId");--> statement-breakpoint
CREATE INDEX "reading_progress_chapter_idx" ON "reading_progress" USING btree ("chapterId");--> statement-breakpoint
CREATE INDEX "share_media_item_idx" ON "share" USING btree ("mediaItemId");--> statement-breakpoint
CREATE INDEX "share_series_idx" ON "share" USING btree ("seriesId");--> statement-breakpoint
CREATE INDEX "share_book_idx" ON "share" USING btree ("bookId");--> statement-breakpoint
CREATE INDEX "watch_progress_media_item_idx" ON "watch_progress" USING btree ("mediaItemId");