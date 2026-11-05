CREATE TABLE `episode_pin` (
	`libraryId` varchar(64) NOT NULL,
	`path` varchar(4096) NOT NULL,
	`pathHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`path`, 256))) STORED,
	`seasonNumber` int NOT NULL,
	`episodeNumber` int NOT NULL,
	`episodeNumberEnd` int,
	`setAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `episode_pin_path_idx` UNIQUE(`libraryId`,`pathHash`)
);
--> statement-breakpoint
ALTER TABLE `series` ADD `episodeOrder` mediumtext;--> statement-breakpoint
ALTER TABLE `series` ADD `episodeTotal` int;--> statement-breakpoint
ALTER TABLE `episode_pin` ADD CONSTRAINT `episode_pin_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;