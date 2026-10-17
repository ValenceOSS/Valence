CREATE TABLE `audit_entry` (
	`id` varchar(64) NOT NULL,
	`at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`actorId` varchar(64),
	`actorName` mediumtext NOT NULL,
	`action` varchar(64) NOT NULL,
	`target` mediumtext,
	`detail` json,
	CONSTRAINT `audit_entry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `play_record` (
	`id` varchar(64) NOT NULL,
	`at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`profileId` varchar(64),
	`mediaItemId` varchar(64) NOT NULL,
	`mode` varchar(32) NOT NULL,
	`reasons` json NOT NULL,
	`client` varchar(255),
	CONSTRAINT `play_record_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_entry` ADD CONSTRAINT `audit_entry_actorId_user_id_fk` FOREIGN KEY (`actorId`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `play_record` ADD CONSTRAINT `play_record_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `play_record` ADD CONSTRAINT `play_record_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_entry_at_idx` ON `audit_entry` (`at`);--> statement-breakpoint
CREATE INDEX `audit_entry_action_idx` ON `audit_entry` (`action`,`at`);--> statement-breakpoint
CREATE INDEX `play_record_at_idx` ON `play_record` (`at`);--> statement-breakpoint
CREATE INDEX `play_record_item_idx` ON `play_record` (`mediaItemId`);