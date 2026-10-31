CREATE TABLE `phone_push` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`profileId` varchar(64),
	`platform` varchar(16) NOT NULL,
	`token` varchar(512) NOT NULL,
	`environment` varchar(16) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `phone_push_id` PRIMARY KEY(`id`),
	CONSTRAINT `phone_push_token_idx` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `phone_push` ADD CONSTRAINT `phone_push_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `phone_push` ADD CONSTRAINT `phone_push_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `phone_push_user_idx` ON `phone_push` (`userId`);