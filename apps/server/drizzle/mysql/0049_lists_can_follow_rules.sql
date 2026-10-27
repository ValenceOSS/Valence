ALTER TABLE `collection` ADD `profileId` varchar(64);--> statement-breakpoint
ALTER TABLE `collection` ADD `isShared` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `collection` ADD `rules` json;--> statement-breakpoint
ALTER TABLE `playlist` ADD `rules` json;--> statement-breakpoint
ALTER TABLE `collection` ADD CONSTRAINT `collection_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `collection_owner_idx` ON `collection` (`profileId`);