CREATE TABLE `season_source` (
	`seriesId` varchar(64) NOT NULL,
	`seasonNumber` int NOT NULL,
	`externalId` mediumtext NOT NULL,
	`externalSeason` int NOT NULL,
	`title` mediumtext NOT NULL,
	`year` int,
	`setAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `season_source_season_idx` UNIQUE(`seriesId`,`seasonNumber`)
);
--> statement-breakpoint
ALTER TABLE `season_source` ADD CONSTRAINT `season_source_seriesId_series_id_fk` FOREIGN KEY (`seriesId`) REFERENCES `series`(`id`) ON DELETE cascade ON UPDATE no action;