ALTER TABLE `user_profile` ADD `wayInId` varchar(36);--> statement-breakpoint
INSERT INTO `user_profile` (`userId`) SELECT `id` FROM `user` WHERE `id` NOT IN (SELECT `userId` FROM `user_profile`);--> statement-breakpoint
UPDATE `user_profile` SET `wayInId` = UUID() WHERE `wayInId` IS NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD CONSTRAINT `user_profile_wayInId_unique` UNIQUE(`wayInId`);
