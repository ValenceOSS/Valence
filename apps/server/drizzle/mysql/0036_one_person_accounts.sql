UPDATE `viewer_profile`
	JOIN `user_profile` ON `user_profile`.`userId` = `viewer_profile`.`userId`
	JOIN (SELECT `userId` FROM `viewer_profile` GROUP BY `userId` HAVING COUNT(*) = 1) AS `ones` ON `ones`.`userId` = `viewer_profile`.`userId`
SET
	`viewer_profile`.`photoPath` = `user_profile`.`photoPath`,
	`viewer_profile`.`avatarStyle` = CASE WHEN `user_profile`.`photoPath` IS NULL THEN `user_profile`.`avatarStyle` END,
	`viewer_profile`.`avatarSeed` = CASE WHEN `user_profile`.`photoPath` IS NULL THEN `user_profile`.`avatarSeed` END,
	`viewer_profile`.`avatarLook` = NULL,
	`viewer_profile`.`updatedAt` = CURRENT_TIMESTAMP(3)
WHERE (`user_profile`.`photoPath` IS NOT NULL OR (`user_profile`.`avatarStyle` IS NOT NULL AND `user_profile`.`avatarSeed` IS NOT NULL))
	AND `viewer_profile`.`photoPath` IS NULL
	AND `viewer_profile`.`avatarStyle` IS NULL
	AND (`viewer_profile`.`avatarLook` IS NULL OR JSON_UNQUOTE(JSON_EXTRACT(`viewer_profile`.`avatarLook`, '$.kind')) = 'initial');
--> statement-breakpoint
UPDATE `user_profile` SET
	`displayName` = NULL,
	`colour` = NULL,
	`avatarStyle` = NULL,
	`avatarSeed` = NULL,
	`photoPath` = NULL,
	`updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `userId` IN (SELECT `userId` FROM (SELECT `userId` FROM `viewer_profile` GROUP BY `userId` HAVING COUNT(*) = 1) AS `ones`)
	AND (`displayName` IS NOT NULL OR `colour` IS NOT NULL OR `avatarStyle` IS NOT NULL OR `avatarSeed` IS NOT NULL OR `photoPath` IS NOT NULL);
