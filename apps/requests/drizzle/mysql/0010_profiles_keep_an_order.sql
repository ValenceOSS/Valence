ALTER TABLE `requests_media_request` ADD `profile_ask` json;--> statement-breakpoint
ALTER TABLE `requests_quality_profile` ADD `position` int DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `requests_quality_profile` AS `profile` JOIN (SELECT `id`, row_number() OVER (ORDER BY `created_at`, `name`) - 1 AS `place` FROM `requests_quality_profile`) AS `ranked` ON `profile`.`id` = `ranked`.`id` SET `profile`.`position` = `ranked`.`place`;
