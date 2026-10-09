ALTER TABLE `requests_media_request` ADD `narrations` json;--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `narrations_wanted` json;--> statement-breakpoint
ALTER TABLE `requests_request_item` ADD `narration` varchar(20);--> statement-breakpoint
ALTER TABLE `requests_request_item` ADD `filed_minutes` double;