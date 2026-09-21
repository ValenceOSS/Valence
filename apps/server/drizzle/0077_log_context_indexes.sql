CREATE INDEX "log_record_job_kind_idx" ON "log_record" USING btree ("jobKind","at");--> statement-breakpoint
CREATE INDEX "log_record_library_idx" ON "log_record" USING btree ("libraryId","at");--> statement-breakpoint
CREATE INDEX "log_record_media_idx" ON "log_record" USING btree ("mediaId","at");--> statement-breakpoint
CREATE INDEX "log_record_session_idx" ON "log_record" USING btree ("sessionId","at");--> statement-breakpoint
CREATE INDEX "log_record_request_idx" ON "log_record" USING btree ("requestId","at");