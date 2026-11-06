CREATE TABLE `version_choice` (
	`libraryId` varchar(64) NOT NULL,
	`path` varchar(4096) NOT NULL,
	`pathHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`path`, 256))) STORED,
	`label` mediumtext,
	`isStanding` boolean NOT NULL DEFAULT false,
	`setAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `version_choice_path_idx` UNIQUE(`libraryId`,`pathHash`)
);
--> statement-breakpoint
ALTER TABLE `version_choice` ADD CONSTRAINT `version_choice_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;