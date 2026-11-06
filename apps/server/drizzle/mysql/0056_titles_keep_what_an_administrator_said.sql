CREATE TABLE `title_change` (
	`id` varchar(64) NOT NULL,
	`changeSetId` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`subjectKey` varchar(4096) NOT NULL,
	`subjectKeyHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`subjectKey`, 256))) STORED,
	`subjectKind` varchar(32) NOT NULL,
	`field` varchar(64) NOT NULL,
	`before` json NOT NULL,
	`after` json NOT NULL,
	`action` varchar(32) NOT NULL,
	`at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`actorId` varchar(64),
	`actorName` mediumtext,
	CONSTRAINT `title_change_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `title_edit` (
	`id` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`subjectKey` varchar(4096) NOT NULL,
	`subjectKeyHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`subjectKey`, 256))) STORED,
	`subjectKind` varchar(32) NOT NULL,
	`field` varchar(64) NOT NULL,
	`value` json,
	`providerValue` json,
	`providerChangedAt` datetime(3),
	`source` varchar(128) NOT NULL DEFAULT 'admin',
	`setAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`setBy` varchar(64),
	CONSTRAINT `title_edit_id` PRIMARY KEY(`id`),
	CONSTRAINT `title_edit_field_idx` UNIQUE(`libraryId`,`subjectKeyHash`,`field`,`source`)
);
--> statement-breakpoint
ALTER TABLE `media_item` ADD `sortTitle` varchar(768);--> statement-breakpoint
ALTER TABLE `media_item` ADD `originalTitle` mediumtext;--> statement-breakpoint
ALTER TABLE `media_item` ADD `seriesSortTitle` varchar(512);--> statement-breakpoint
ALTER TABLE `media_item` ADD `tags` json;--> statement-breakpoint
ALTER TABLE `media_item` ADD `studios` json;--> statement-breakpoint
ALTER TABLE `media_item` ADD `networks` json;--> statement-breakpoint
ALTER TABLE `media_item` ADD `externalKind` varchar(32);--> statement-breakpoint
ALTER TABLE `media_item` ADD `catalogueEpisodeId` varchar(64);--> statement-breakpoint
ALTER TABLE `media_item` ADD `tvdbId` varchar(64);--> statement-breakpoint
ALTER TABLE `title_change` ADD CONSTRAINT `title_change_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `title_change` ADD CONSTRAINT `title_change_actorId_user_id_fk` FOREIGN KEY (`actorId`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `title_edit` ADD CONSTRAINT `title_edit_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `title_edit` ADD CONSTRAINT `title_edit_setBy_user_id_fk` FOREIGN KEY (`setBy`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `title_change_subject_idx` ON `title_change` (`libraryId`,`subjectKeyHash`,`at`);--> statement-breakpoint
CREATE INDEX `title_change_set_idx` ON `title_change` (`changeSetId`);--> statement-breakpoint
CREATE INDEX `title_edit_subject_idx` ON `title_edit` (`libraryId`,`subjectKeyHash`);