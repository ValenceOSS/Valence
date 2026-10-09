ALTER TABLE `requests_quality_profile` ADD `formats` json DEFAULT ('[]') NOT NULL;--> statement-breakpoint
ALTER TABLE `requests_quality_profile` ADD `min_format_score` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `requests_quality_profile` ADD `upgrade_until_format_score` int;