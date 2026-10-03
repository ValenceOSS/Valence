CREATE TABLE `calendar_feed` (
	`id` varchar(64) NOT NULL,
	`tokenHash` varchar(255) NOT NULL,
	`sealedToken` mediumtext NOT NULL,
	`ownerKey` varchar(255) NOT NULL,
	`accountId` varchar(64) NOT NULL,
	`profileId` varchar(64),
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`lastReadAt` datetime(3),
	CONSTRAINT `calendar_feed_id` PRIMARY KEY(`id`),
	CONSTRAINT `calendar_feed_token_idx` UNIQUE(`tokenHash`),
	CONSTRAINT `calendar_feed_owner_idx` UNIQUE(`ownerKey`)
);
--> statement-breakpoint
ALTER TABLE `calendar_feed` ADD CONSTRAINT `calendar_feed_accountId_user_id_fk` FOREIGN KEY (`accountId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_feed` ADD CONSTRAINT `calendar_feed_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `calendar_feed_account_idx` ON `calendar_feed` (`accountId`);