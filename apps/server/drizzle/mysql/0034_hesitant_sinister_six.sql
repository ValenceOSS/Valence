CREATE TABLE `api_key_profile` (
	`keyId` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	CONSTRAINT `api_key_profile_keyId` PRIMARY KEY(`keyId`)
);
--> statement-breakpoint
CREATE TABLE `profile_age_ceiling` (
	`profileId` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`maximumAge` int NOT NULL,
	`allowsUnrated` boolean NOT NULL DEFAULT false,
	`setAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `profile_age_ceiling_profileId_libraryId_pk` PRIMARY KEY(`profileId`,`libraryId`),
	CONSTRAINT `profile_age_ceiling_range` CHECK(`profile_age_ceiling`.`maximumAge` between 0 and 21)
);
--> statement-breakpoint
CREATE TABLE `profile_library_block` (
	`profileId` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`blockedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `profile_library_block_profileId_libraryId_pk` PRIMARY KEY(`profileId`,`libraryId`)
);
--> statement-breakpoint
CREATE TABLE `session_profile` (
	`sessionId` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`chosenAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `session_profile_sessionId` PRIMARY KEY(`sessionId`)
);
--> statement-breakpoint
DROP TABLE `child_account`;--> statement-breakpoint
ALTER TABLE `notification` ADD `profileId` varchar(64);--> statement-breakpoint
ALTER TABLE `share` ADD `createdByProfileId` varchar(64);--> statement-breakpoint
ALTER TABLE `viewer_profile` ADD `isOwner` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `viewer_profile` ADD `pinHash` mediumtext;--> statement-breakpoint
ALTER TABLE `viewer_profile` ADD `pinFailures` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `viewer_profile` ADD `pinLockedUntil` datetime(3);--> statement-breakpoint
ALTER TABLE `viewer_profile` ADD `mayRequest` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `api_key_profile` ADD CONSTRAINT `api_key_profile_keyId_apikey_id_fk` FOREIGN KEY (`keyId`) REFERENCES `apikey`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_key_profile` ADD CONSTRAINT `api_key_profile_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profile_age_ceiling` ADD CONSTRAINT `profile_age_ceiling_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profile_age_ceiling` ADD CONSTRAINT `profile_age_ceiling_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profile_library_block` ADD CONSTRAINT `profile_library_block_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profile_library_block` ADD CONSTRAINT `profile_library_block_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session_profile` ADD CONSTRAINT `session_profile_sessionId_session_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `session`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session_profile` ADD CONSTRAINT `session_profile_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `profile_age_ceiling_library_idx` ON `profile_age_ceiling` (`libraryId`);--> statement-breakpoint
CREATE INDEX `profile_library_block_library_idx` ON `profile_library_block` (`libraryId`);--> statement-breakpoint
ALTER TABLE `notification` ADD CONSTRAINT `notification_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `share` ADD CONSTRAINT `share_createdByProfileId_viewer_profile_id_fk` FOREIGN KEY (`createdByProfileId`) REFERENCES `viewer_profile`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
UPDATE `viewer_profile` JOIN (SELECT `id` FROM (SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `userId` ORDER BY `createdAt`, `id`) AS `place` FROM `viewer_profile`) AS `ranked` WHERE `place` = 1) AS `firsts` ON `viewer_profile`.`id` = `firsts`.`id` SET `viewer_profile`.`isOwner` = true;--> statement-breakpoint
INSERT INTO `api_key_profile` (`keyId`, `profileId`) SELECT k.`id`, p.`id` FROM `apikey` k JOIN `viewer_profile` p ON p.`userId` = k.`referenceId` AND p.`isOwner` = true;