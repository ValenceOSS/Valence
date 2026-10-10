ALTER TABLE `requests_media_request` ADD `origin` varchar(16) DEFAULT 'asked' NOT NULL;--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `is_followed` boolean DEFAULT false NOT NULL;