CREATE TABLE `plugin_credential` (
	`id` varchar(64) NOT NULL,
	`pluginId` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`login` varchar(100) NOT NULL,
	`label` varchar(100) NOT NULL,
	`secretHash` varchar(64) NOT NULL,
	`sealedSecret` varchar(1000) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`lastUsedAt` datetime(3),
	CONSTRAINT `plugin_credential_id` PRIMARY KEY(`id`),
	CONSTRAINT `plugin_credential_login_idx` UNIQUE(`pluginId`,`login`),
	CONSTRAINT `plugin_credential_secret_idx` UNIQUE(`secretHash`)
);
--> statement-breakpoint
ALTER TABLE `plugin_credential` ADD CONSTRAINT `plugin_credential_pluginId_plugin_installation_id_fk` FOREIGN KEY (`pluginId`) REFERENCES `plugin_installation`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plugin_credential` ADD CONSTRAINT `plugin_credential_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `plugin_credential_profile_idx` ON `plugin_credential` (`profileId`);