UPDATE `viewer_profile` JOIN (SELECT `id` FROM (SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `userId` ORDER BY `createdAt`, `id`) AS `place` FROM `viewer_profile` WHERE `isOwner` = true) AS `ranked` WHERE `place` > 1) AS `extras` ON `viewer_profile`.`id` = `extras`.`id` SET `viewer_profile`.`isOwner` = false;--> statement-breakpoint
ALTER TABLE `viewer_profile` ADD `ownerOf` varchar(64) GENERATED ALWAYS AS (case when `isOwner` then `userId` end) VIRTUAL;--> statement-breakpoint
ALTER TABLE `viewer_profile` ADD CONSTRAINT `viewer_profile_owner_idx` UNIQUE(`ownerOf`);
