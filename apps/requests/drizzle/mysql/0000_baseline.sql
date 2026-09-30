CREATE TABLE `requests_blocklisted_release` (
	`id` char(36) NOT NULL,
	`request_id` char(36) NOT NULL,
	`title` varchar(700) NOT NULL,
	`indexer_id` char(36),
	`reason` mediumtext NOT NULL,
	`at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `requests_blocklisted_release_id` PRIMARY KEY(`id`),
	CONSTRAINT `blocklisted_release_title` UNIQUE(`request_id`,`title`)
);
--> statement-breakpoint
CREATE TABLE `requests_download_client` (
	`id` char(36) NOT NULL,
	`name` mediumtext NOT NULL,
	`kind` varchar(32) NOT NULL,
	`url` mediumtext NOT NULL,
	`username` mediumtext NOT NULL DEFAULT (''),
	`password` mediumtext NOT NULL DEFAULT (''),
	`api_key` mediumtext NOT NULL DEFAULT (''),
	`categories` json NOT NULL DEFAULT ('{"movies":"valence-films","shows":"valence-series","music":"valence-music","books":"valence-books"}'),
	`remote_path` mediumtext NOT NULL DEFAULT (''),
	`local_path` mediumtext NOT NULL DEFAULT (''),
	`priority` int NOT NULL DEFAULT 25,
	`is_enabled` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `requests_download_client_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests_give_up_rules` (
	`id` int NOT NULL DEFAULT 1,
	`metadata_minutes` int,
	`stalled_hours` int,
	`slow_days` int,
	`refuses_unknown_files` boolean NOT NULL DEFAULT true,
	`updated_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `requests_give_up_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests_indexer` (
	`id` char(36) NOT NULL,
	`name` mediumtext NOT NULL,
	`kind` varchar(32) NOT NULL,
	`definition_id` varchar(255),
	`settings` json NOT NULL DEFAULT ('{}'),
	`session` json,
	`url` mediumtext NOT NULL,
	`api_key` mediumtext NOT NULL DEFAULT (''),
	`priority` int NOT NULL DEFAULT 25,
	`is_enabled` boolean NOT NULL DEFAULT true,
	`categories` json NOT NULL DEFAULT ('[]'),
	`requests_per_minute` int,
	`timeout_seconds` int NOT NULL DEFAULT 30,
	`removes_when_done` boolean,
	`seed_seconds` int,
	`seed_ratio` double,
	`capabilities` json,
	`failures` int NOT NULL DEFAULT 0,
	`last_problem` mediumtext,
	`last_problem_code` varchar(64),
	`last_failed_at` datetime(3),
	`turned_off_because` mediumtext,
	`created_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `requests_indexer_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests_indexer_definition` (
	`id` varchar(255) NOT NULL,
	`name` mediumtext NOT NULL,
	`description` mediumtext NOT NULL DEFAULT (''),
	`language` varchar(64) NOT NULL DEFAULT '',
	`privacy` varchar(32) NOT NULL,
	`categories` json NOT NULL DEFAULT ('[]'),
	`yaml` mediumtext NOT NULL,
	`sha` varchar(64) NOT NULL,
	`fetched_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `requests_indexer_definition_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests_media_request` (
	`id` char(36) NOT NULL,
	`kind` varchar(32) NOT NULL,
	`tmdb_id` int,
	`music_brainz_id` varchar(64),
	`open_library_id` int,
	`title` mediumtext NOT NULL,
	`artist_name` mediumtext,
	`year` int,
	`aliases` json NOT NULL DEFAULT ('[]'),
	`overview` mediumtext,
	`poster_url` mediumtext,
	`library_id` varchar(64) NOT NULL,
	`library_path` mediumtext NOT NULL,
	`profile_id` char(36),
	`library_language` varchar(64),
	`is_picked_by_hand` boolean NOT NULL DEFAULT false,
	`approval` varchar(32) NOT NULL DEFAULT 'awaiting',
	`refused_because` mediumtext,
	`requested_by_id` varchar(64) NOT NULL,
	`requested_by_name` mediumtext NOT NULL,
	`seasons` json,
	`release_types` json,
	`runtime_minutes` int,
	`release_dates` json NOT NULL DEFAULT ('{"theatrical":null,"digital":null,"physical":null}'),
	`is_ended` boolean NOT NULL DEFAULT false,
	`media_id` varchar(64),
	`problem` mediumtext,
	`problem_code` varchar(64),
	`catalogue_checked_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`created_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `requests_media_request_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_request_title` UNIQUE(`kind`,`tmdb_id`),
	CONSTRAINT `media_request_music` UNIQUE(`kind`,`music_brainz_id`),
	CONSTRAINT `media_request_book` UNIQUE(`kind`,`open_library_id`)
);
--> statement-breakpoint
CREATE TABLE `requests_quality_profile` (
	`id` char(36) NOT NULL,
	`name` mediumtext NOT NULL,
	`kind` varchar(32) NOT NULL,
	`resolutions` json NOT NULL DEFAULT ('[]'),
	`sources` json NOT NULL DEFAULT ('[]'),
	`music_qualities` json NOT NULL DEFAULT ('[]'),
	`smallest_mb` double,
	`largest_mb` double,
	`sizes` json NOT NULL DEFAULT ('[]'),
	`preferred_words` json NOT NULL DEFAULT ('[]'),
	`required_words` json NOT NULL DEFAULT ('[]'),
	`banned_words` json NOT NULL DEFAULT ('[]'),
	`is_upgrading` boolean NOT NULL DEFAULT false,
	`release_wait` varchar(32) NOT NULL DEFAULT 'digital',
	`upgrade_until_resolution` varchar(32),
	`upgrade_until_source` varchar(32),
	`upgrade_until_music_quality` varchar(32),
	`library_ids` json NOT NULL DEFAULT ('[]'),
	`preferred_language` varchar(64),
	`is_default` boolean NOT NULL DEFAULT false,
	`role_ids` json NOT NULL DEFAULT ('[]'),
	`account_ids` json NOT NULL DEFAULT ('[]'),
	`created_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `requests_quality_profile_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests_request_item` (
	`id` char(36) NOT NULL,
	`request_id` char(36) NOT NULL,
	`music_brainz_id` varchar(64),
	`season` int,
	`episode` int,
	`title` mediumtext NOT NULL,
	`air_date` varchar(32),
	`state` varchar(32) NOT NULL DEFAULT 'waiting',
	`problem` mediumtext,
	`problem_code` varchar(64),
	`release_title` mediumtext,
	`indexer_id` char(36),
	`download_id` char(36),
	`file_path` mediumtext,
	`score` double,
	`filed_title` mediumtext,
	`filed_score` double,
	`downloaded_bytes` double,
	`download_seconds` double,
	`attempts` int NOT NULL DEFAULT 0,
	`is_picked_by_hand` boolean NOT NULL DEFAULT false,
	`last_searched_at` datetime(3),
	`updated_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `requests_request_item_id` PRIMARY KEY(`id`),
	CONSTRAINT `request_item_episode` UNIQUE(`request_id`,`season`,`episode`),
	CONSTRAINT `request_item_album` UNIQUE(`request_id`,`music_brainz_id`)
);
--> statement-breakpoint
CREATE TABLE `requests_request_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_id` char(36) NOT NULL,
	`message` mediumtext NOT NULL,
	`problem_code` varchar(64),
	`at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `requests_request_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests_download` (
	`id` char(36) NOT NULL,
	`client_id` char(36) NOT NULL,
	`remote_id` varchar(255) NOT NULL,
	`content_path` mediumtext,
	`protocol` varchar(32) NOT NULL,
	`library_kind` varchar(32) NOT NULL DEFAULT 'movies',
	`title` mediumtext NOT NULL,
	`indexer_name` mediumtext,
	`state` varchar(32) NOT NULL DEFAULT 'queued',
	`problem` mediumtext,
	`problem_code` varchar(64),
	`progress` double NOT NULL DEFAULT 0,
	`size_bytes` double,
	`done_bytes` double,
	`sent_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`finished_at` datetime(3),
	`library_id` varchar(64),
	`library_path` mediumtext,
	`filed_into` mediumtext,
	`filing_problem` mediumtext,
	`filing_problem_code` varchar(64),
	`filing_attempts` int NOT NULL DEFAULT 0,
	`files_checked` boolean NOT NULL DEFAULT false,
	`removes_when_done` boolean NOT NULL DEFAULT false,
	`seed_seconds` int,
	`seed_ratio` double,
	`updated_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `requests_download_id` PRIMARY KEY(`id`),
	CONSTRAINT `download_client_remote` UNIQUE(`client_id`,`remote_id`)
);
--> statement-breakpoint
CREATE TABLE `requests_download_event` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` varchar(64) NOT NULL,
	`title` mediumtext NOT NULL,
	`client_name` mediumtext,
	`problem` mediumtext,
	`details` json NOT NULL DEFAULT ('{}'),
	`at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `requests_download_event_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests_setting` (
	`key` varchar(255) NOT NULL,
	`value` json NOT NULL,
	`updated_at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `requests_setting_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
ALTER TABLE `requests_blocklisted_release` ADD CONSTRAINT `requests_blocklisted_release_request_id_fk` FOREIGN KEY (`request_id`) REFERENCES `requests_media_request`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requests_request_item` ADD CONSTRAINT `requests_request_item_request_id_fk` FOREIGN KEY (`request_id`) REFERENCES `requests_media_request`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requests_request_item` ADD CONSTRAINT `requests_request_item_download_id_fk` FOREIGN KEY (`download_id`) REFERENCES `requests_download`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requests_request_log` ADD CONSTRAINT `requests_request_log_request_id_fk` FOREIGN KEY (`request_id`) REFERENCES `requests_media_request`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requests_download` ADD CONSTRAINT `requests_download_client_id_fk` FOREIGN KEY (`client_id`) REFERENCES `requests_download_client`(`id`) ON DELETE cascade ON UPDATE no action;