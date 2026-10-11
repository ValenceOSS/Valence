CREATE TABLE `live_channel` (
	`id` varchar(64) NOT NULL,
	`sourceId` varchar(64) NOT NULL,
	`position` int NOT NULL,
	`number` varchar(32),
	`name` varchar(255) NOT NULL,
	`groupName` varchar(255),
	`logoUrl` mediumtext,
	`guideId` varchar(255),
	`streamUrl` mediumtext NOT NULL,
	CONSTRAINT `live_channel_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_favourite` (
	`profileId` varchar(64) NOT NULL,
	`channelId` varchar(64) NOT NULL,
	`keptAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `live_favourite_profileId_channelId_pk` PRIMARY KEY(`profileId`,`channelId`)
);
--> statement-breakpoint
CREATE TABLE `live_programme` (
	`id` varchar(64) NOT NULL,
	`sourceId` varchar(64) NOT NULL,
	`guideId` varchar(255) NOT NULL,
	`startsAt` datetime(3) NOT NULL,
	`endsAt` datetime(3) NOT NULL,
	`title` mediumtext NOT NULL,
	`subtitle` mediumtext,
	`description` mediumtext,
	`category` varchar(255),
	CONSTRAINT `live_programme_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_source` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`kind` varchar(32) NOT NULL,
	`address` mediumtext,
	`guideUrl` mediumtext,
	`logoUrl` mediumtext,
	`playlist` longtext,
	`channelCount` int NOT NULL DEFAULT 0,
	`refreshedAt` datetime(3),
	`problem` json,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `live_source_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `live_channel` ADD CONSTRAINT `live_channel_sourceId_live_source_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `live_source`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_favourite` ADD CONSTRAINT `live_favourite_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_favourite` ADD CONSTRAINT `live_favourite_channelId_live_channel_id_fk` FOREIGN KEY (`channelId`) REFERENCES `live_channel`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_programme` ADD CONSTRAINT `live_programme_sourceId_live_source_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `live_source`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `live_channel_source_idx` ON `live_channel` (`sourceId`,`position`);--> statement-breakpoint
CREATE INDEX `live_programme_channel_idx` ON `live_programme` (`sourceId`,`guideId`,`startsAt`);--> statement-breakpoint
CREATE INDEX `live_programme_ends_idx` ON `live_programme` (`endsAt`);