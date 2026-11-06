CREATE TABLE `word_rule` (
	`id` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`field` varchar(32) NOT NULL,
	`find` varchar(256) NOT NULL,
	`replace` varchar(256) NOT NULL,
	`setAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `word_rule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `word_rule` ADD CONSTRAINT `word_rule_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `word_rule_library_idx` ON `word_rule` (`libraryId`);