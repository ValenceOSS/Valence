CREATE TABLE `child_account` (
	`userId` varchar(64) NOT NULL,
	`ownerId` varchar(64) NOT NULL,
	`pinHash` varchar(255),
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `child_account_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
ALTER TABLE `child_account` ADD CONSTRAINT `child_account_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `child_account` ADD CONSTRAINT `child_account_ownerId_user_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `child_account_owner_idx` ON `child_account` (`ownerId`);