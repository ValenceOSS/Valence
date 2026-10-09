ALTER TABLE `requests_media_request` ADD `upgrades_to_lossless` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `requests_request_item` ADD `track_count` int;--> statement-breakpoint
ALTER TABLE `requests_request_item` ADD `filed_track_count` int;--> statement-breakpoint
ALTER TABLE `requests_request_item` ADD `held_quality` varchar(16);