ALTER TABLE `requests_blocklisted_release` ADD `info_hash` varchar(64);--> statement-breakpoint
ALTER TABLE `requests_request_item` ADD `is_followed` boolean DEFAULT true NOT NULL;