CREATE TABLE `plugin_secret` (
	`pluginId` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`key` varchar(200) NOT NULL,
	`value` mediumtext NOT NULL,
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `plugin_secret_pluginId_profileId_key_pk` PRIMARY KEY(`pluginId`,`profileId`,`key`)
);
--> statement-breakpoint
ALTER TABLE `plugin_secret` ADD CONSTRAINT `plugin_secret_pluginId_plugin_installation_id_fk` FOREIGN KEY (`pluginId`) REFERENCES `plugin_installation`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plugin_secret` ADD CONSTRAINT `plugin_secret_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;