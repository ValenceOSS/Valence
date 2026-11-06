CREATE TABLE `extra_choice` (
	`libraryId` varchar(64) NOT NULL,
	`path` varchar(4096) NOT NULL,
	`pathHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`path`, 256))) STORED,
	`extraKind` varchar(32),
	`parentPath` varchar(4096),
	`setAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `extra_choice_path_idx` UNIQUE(`libraryId`,`pathHash`)
);
--> statement-breakpoint
ALTER TABLE `extra_choice` ADD CONSTRAINT `extra_choice_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;