CREATE TABLE `requests_arr_app` (
	`id` char(36) NOT NULL,
	`name` mediumtext NOT NULL,
	`kind` varchar(32) NOT NULL,
	`url` mediumtext NOT NULL,
	`api_key` mediumtext NOT NULL DEFAULT (''),
	`remote_path` mediumtext NOT NULL DEFAULT (''),
	`local_path` mediumtext NOT NULL DEFAULT (''),
	`is_enabled` boolean NOT NULL DEFAULT true,
	`is_working` boolean,
	`version` mediumtext,
	`last_checked_at` datetime(3),
	`last_problem` json,
	`last_problem_code` varchar(64),
	`created_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `requests_arr_app_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `requests_indexer` ADD `source_app_id` char(36);--> statement-breakpoint
ALTER TABLE `requests_indexer` ADD `source_indexer_id` int;--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `tvdb_id` int;--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `hand_off` json;--> statement-breakpoint
ALTER TABLE `requests_media_request` ADD `hand_off_id` int;