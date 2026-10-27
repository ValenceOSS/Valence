CREATE TABLE `streamed_choice` (
	`mediaItemId` varchar(64) NOT NULL,
	`pluginId` varchar(64) NOT NULL,
	`sourceId` varchar(40) NOT NULL,
	`streamKey` varchar(200) NOT NULL,
	`name` mediumtext NOT NULL,
	`infoHash` varchar(40),
	`fileName` mediumtext,
	`sizeBytes` bigint,
	`chosenAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `streamed_choice_mediaItemId` PRIMARY KEY(`mediaItemId`)
);
--> statement-breakpoint
ALTER TABLE `library` ADD `isStreamed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `streamed_choice` ADD CONSTRAINT `streamed_choice_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT IGNORE INTO `role_permission` (`roleId`, `permission`)
SELECT `role`.`id`, 'sources.play'
FROM `role`
WHERE `role`.`name` IN ('Member', 'Manager');
