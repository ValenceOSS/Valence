CREATE TABLE `plugin_previous_storage` (
	`pluginId` varchar(64) NOT NULL,
	`key` varchar(512) NOT NULL,
	`value` json NOT NULL,
	`bytes` int NOT NULL,
	CONSTRAINT `plugin_previous_storage_pluginId_key_pk` PRIMARY KEY(`pluginId`,`key`)
);
--> statement-breakpoint
ALTER TABLE `plugin_previous` ADD `settings` json;--> statement-breakpoint
ALTER TABLE `plugin_previous_storage` ADD CONSTRAINT `plugin_previous_storage_pluginId_plugin_installation_id_fk` FOREIGN KEY (`pluginId`) REFERENCES `plugin_installation`(`id`) ON DELETE cascade ON UPDATE no action;