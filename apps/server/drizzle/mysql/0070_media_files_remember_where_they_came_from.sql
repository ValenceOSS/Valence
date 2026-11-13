CREATE TABLE `media_origin` (
	`libraryId` varchar(64) NOT NULL,
	`path` varchar(4096) NOT NULL,
	`pathHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`path`, 256))) STORED,
	`source` varchar(32) NOT NULL,
	`via` mediumtext,
	`recordedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `media_origin_path_idx` UNIQUE(`libraryId`,`pathHash`),
	CONSTRAINT `media_origin_source` CHECK(`media_origin`.`source` in ('upload', 'import'))
);
--> statement-breakpoint
ALTER TABLE `media_origin` ADD CONSTRAINT `media_origin_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;