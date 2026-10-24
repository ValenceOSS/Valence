ALTER TABLE `requests_indexer_definition` ADD `is_upstream` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `requests_quality_profile` ADD `is_fallback` boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `requests_quality_profile` AS `profile` JOIN (SELECT `id` FROM (SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `kind` ORDER BY `position`, `name`) AS `place` FROM `requests_quality_profile`) AS `ranked` WHERE `ranked`.`place` = 1) AS `first` ON `profile`.`id` = `first`.`id` SET `profile`.`is_fallback` = true;
