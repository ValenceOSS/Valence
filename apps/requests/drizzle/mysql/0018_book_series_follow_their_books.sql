ALTER TABLE `requests_media_request` ADD `series_asin` varchar(20);--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `series_request_id` char(36);--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `books` json;--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `companions_wanted` json;--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `keeps_one_narrator` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `series_narrators` json;--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD CONSTRAINT `media_request_book_series` UNIQUE(`kind`,`series_asin`);