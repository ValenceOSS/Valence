CREATE TABLE `media_part` (
	`mediaItemId` varchar(64) NOT NULL,
	`position` int NOT NULL,
	`path` varchar(4096) NOT NULL,
	`pathHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`path`, 256))) STORED,
	`sizeBytes` bigint NOT NULL,
	`modifiedAtMs` bigint NOT NULL,
	`durationSeconds` float NOT NULL,
	CONSTRAINT `media_part_mediaItemId_position_pk` PRIMARY KEY(`mediaItemId`,`position`)
);
--> statement-breakpoint
ALTER TABLE `media_part` ADD CONSTRAINT `media_part_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `media_part_path_idx` ON `media_part` (`pathHash`);