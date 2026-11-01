CREATE TABLE `device_name` (
	`userId` varchar(64) NOT NULL,
	`deviceId` varchar(64) NOT NULL,
	`name` varchar(80) NOT NULL,
	`renamedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `device_name_userId_deviceId_pk` PRIMARY KEY(`userId`,`deviceId`)
);
--> statement-breakpoint
ALTER TABLE `session` ADD `deviceId` varchar(64);--> statement-breakpoint
ALTER TABLE `session` ADD `device` json;--> statement-breakpoint
ALTER TABLE `session` ADD `lastActiveAt` datetime(3);--> statement-breakpoint
ALTER TABLE `device_name` ADD CONSTRAINT `device_name_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;