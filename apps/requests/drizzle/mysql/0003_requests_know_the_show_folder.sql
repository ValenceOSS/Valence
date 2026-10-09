ALTER TABLE `requests_media_request` ADD `library_folder` mediumtext;--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `season_folders` json DEFAULT ('[]') NOT NULL;