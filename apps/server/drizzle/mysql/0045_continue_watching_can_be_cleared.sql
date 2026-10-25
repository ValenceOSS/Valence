CREATE TABLE `continue_watching_dismissal` (
	`profileId` varchar(64) NOT NULL,
	`mediaItemId` varchar(64) NOT NULL,
	`dismissedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `continue_watching_dismissal_profileId_mediaItemId_pk` PRIMARY KEY(`profileId`,`mediaItemId`)
);
--> statement-breakpoint
ALTER TABLE `continue_watching_dismissal` ADD CONSTRAINT `continue_watching_dismissal_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `continue_watching_dismissal` ADD CONSTRAINT `continue_watching_dismissal_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `continue_watching_dismissal_media_item_idx` ON `continue_watching_dismissal` (`mediaItemId`);