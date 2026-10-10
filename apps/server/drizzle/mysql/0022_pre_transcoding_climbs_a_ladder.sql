ALTER TABLE `pre_transcode_refusal` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `pre_transcode_refusal` MODIFY COLUMN `target` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `pre_transcode_refusal` ADD PRIMARY KEY(`mediaItemId`,`target`);