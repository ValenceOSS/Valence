ALTER TABLE `requests_indexer` ADD `library_ids` json DEFAULT ('[]') NOT NULL;--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `indexer_ids` json;