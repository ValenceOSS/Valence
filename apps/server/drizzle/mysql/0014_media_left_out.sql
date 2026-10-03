CREATE TABLE `media_left_out` (
	`id` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`path` varchar(4096) NOT NULL,
	`pathHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`path`, 256))) STORED,
	`isFolder` boolean NOT NULL DEFAULT false,
	`note` mediumtext,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`createdBy` mediumtext,
	CONSTRAINT `media_left_out_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_left_out_path_idx` UNIQUE(`libraryId`,`pathHash`)
);
--> statement-breakpoint
ALTER TABLE `media_left_out` ADD CONSTRAINT `media_left_out_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `media_left_out_library_idx` ON `media_left_out` (`libraryId`);