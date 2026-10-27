ALTER TABLE `requests_request_item` ADD `missing_from` json DEFAULT ('[]') NOT NULL;--> statement-breakpoint
ALTER TABLE `requests_download` ADD `request_id` char(36);--> statement-breakpoint
ALTER TABLE `requests_download` ADD `is_unneeded` boolean DEFAULT false NOT NULL;