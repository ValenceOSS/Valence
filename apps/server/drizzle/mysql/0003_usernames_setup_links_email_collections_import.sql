CREATE TABLE `account_setup_link` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`tokenHash` varchar(255) NOT NULL,
	`expiresAt` datetime(3) NOT NULL,
	`usedAt` datetime(3),
	`revokedAt` datetime(3),
	`createdBy` varchar(64),
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `account_setup_link_id` PRIMARY KEY(`id`),
	CONSTRAINT `account_setup_link_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `collection` (
	`id` varchar(64) NOT NULL,
	`name` mediumtext NOT NULL,
	`description` mediumtext,
	`artworkPath` mediumtext,
	`isOrdered` boolean NOT NULL DEFAULT false,
	`createdBy` varchar(64),
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `collection_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collection_entry` (
	`id` varchar(64) NOT NULL,
	`collectionId` varchar(64) NOT NULL,
	`mediaItemId` varchar(64),
	`seriesId` varchar(64),
	`position` double NOT NULL,
	`addedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `collection_entry_id` PRIMARY KEY(`id`),
	CONSTRAINT `collection_entry_item_idx` UNIQUE(`collectionId`,`mediaItemId`),
	CONSTRAINT `collection_entry_series_idx` UNIQUE(`collectionId`,`seriesId`)
);
--> statement-breakpoint
CREATE TABLE `email_send` (
	`id` varchar(64) NOT NULL,
	`kind` varchar(64) NOT NULL,
	`recipient` mediumtext NOT NULL,
	`idempotencyKey` varchar(255) NOT NULL,
	`state` varchar(16) NOT NULL,
	`failure` json,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `email_send_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_send_idempotencyKey_unique` UNIQUE(`idempotencyKey`),
	CONSTRAINT `email_send_state` CHECK(`email_send`.`state` in ('sent', 'failed'))
);
--> statement-breakpoint
CREATE TABLE `import_link` (
	`id` varchar(64) NOT NULL,
	`sourceId` varchar(64) NOT NULL,
	`kind` varchar(32) NOT NULL,
	`sourceKey` varchar(4096) NOT NULL,
	`sourceKeyHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`sourceKey`, 256))) STORED,
	`valenceId` varchar(255) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `import_link_id` PRIMARY KEY(`id`),
	CONSTRAINT `import_link_key_idx` UNIQUE(`sourceId`,`kind`,`sourceKeyHash`)
);
--> statement-breakpoint
CREATE TABLE `import_run` (
	`id` varchar(64) NOT NULL,
	`sourceId` varchar(64) NOT NULL,
	`state` varchar(16) NOT NULL DEFAULT 'planning',
	`options` json NOT NULL,
	`cursor` json,
	`report` json,
	`failure` json,
	`jobId` varchar(64),
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`startedAt` datetime(3),
	`finishedAt` datetime(3),
	CONSTRAINT `import_run_id` PRIMARY KEY(`id`),
	CONSTRAINT `import_run_state` CHECK(`import_run`.`state` in ('planning', 'planned', 'importing', 'completed', 'failed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE `import_source` (
	`id` varchar(64) NOT NULL,
	`kind` varchar(32) NOT NULL,
	`name` mediumtext NOT NULL,
	`url` mediumtext NOT NULL,
	`token` mediumtext NOT NULL,
	`details` json NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `import_source_id` PRIMARY KEY(`id`),
	CONSTRAINT `import_source_kind` CHECK(`import_source`.`kind` in ('jellyfin', 'emby', 'plex', 'radarr', 'sonarr', 'lidarr', 'prowlarr', 'overseerr', 'jellyseerr'))
);
--> statement-breakpoint
ALTER TABLE `user` ADD `username` varchar(255);--> statement-breakpoint
ALTER TABLE `user` ADD `displayUsername` mediumtext;--> statement-breakpoint
ALTER TABLE `watch_history` ADD `importedFrom` varchar(32);--> statement-breakpoint
ALTER TABLE `watch_history` ADD `importKey` varchar(255);--> statement-breakpoint
ALTER TABLE `user` ADD CONSTRAINT `user_username_unique` UNIQUE(`username`);--> statement-breakpoint
ALTER TABLE `watch_history` ADD CONSTRAINT `watch_history_importKey_unique` UNIQUE(`importKey`);--> statement-breakpoint
ALTER TABLE `account_setup_link` ADD CONSTRAINT `account_setup_link_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `account_setup_link` ADD CONSTRAINT `account_setup_link_createdBy_user_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collection` ADD CONSTRAINT `collection_createdBy_user_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collection_entry` ADD CONSTRAINT `collection_entry_collectionId_collection_id_fk` FOREIGN KEY (`collectionId`) REFERENCES `collection`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collection_entry` ADD CONSTRAINT `collection_entry_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collection_entry` ADD CONSTRAINT `collection_entry_seriesId_series_id_fk` FOREIGN KEY (`seriesId`) REFERENCES `series`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `import_link` ADD CONSTRAINT `import_link_sourceId_import_source_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `import_source`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `import_run` ADD CONSTRAINT `import_run_sourceId_import_source_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `import_source`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_setup_link_user_idx` ON `account_setup_link` (`userId`);--> statement-breakpoint
CREATE INDEX `collection_entry_order_idx` ON `collection_entry` (`collectionId`,`position`);--> statement-breakpoint
CREATE INDEX `collection_entry_media_item_idx` ON `collection_entry` (`mediaItemId`);--> statement-breakpoint
CREATE INDEX `collection_entry_series_id_idx` ON `collection_entry` (`seriesId`);--> statement-breakpoint
CREATE INDEX `email_send_recent_idx` ON `email_send` (`createdAt`);--> statement-breakpoint
CREATE INDEX `import_link_valence_idx` ON `import_link` (`kind`,`valenceId`);--> statement-breakpoint
CREATE INDEX `import_run_source_idx` ON `import_run` (`sourceId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `import_run_state_idx` ON `import_run` (`state`);