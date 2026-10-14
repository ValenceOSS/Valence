ALTER TABLE `requests_media_request` ADD `anime` json;--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `anime_audio` varchar(24);--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `preferred_group` varchar(80);--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `cour_order` varchar(40);--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `numbering_by_group` json;--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `anime_questions` json;--> statement-breakpoint
ALTER TABLE `requests_quality_profile` ADD `anime_audio` varchar(24) DEFAULT 'subbed' NOT NULL;--> statement-breakpoint
ALTER TABLE `requests_request_item` ADD `cour` int;--> statement-breakpoint
ALTER TABLE `requests_request_item` ADD `absolute` int;