CREATE TABLE `plugin_home_row` (
	`pluginId` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`rowId` varchar(40) NOT NULL,
	`chosenAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `plugin_home_row_pluginId_profileId_rowId_pk` PRIMARY KEY(`pluginId`,`profileId`,`rowId`)
);
--> statement-breakpoint
ALTER TABLE `plugin_home_row` ADD CONSTRAINT `plugin_home_row_pluginId_plugin_installation_id_fk` FOREIGN KEY (`pluginId`) REFERENCES `plugin_installation`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plugin_home_row` ADD CONSTRAINT `plugin_home_row_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;