CREATE TABLE `title_likeness` (
	`kind` varchar(16) NOT NULL,
	`catalogueId` varchar(64) NOT NULL,
	`genreIds` json NOT NULL,
	`keywordIds` json NOT NULL,
	`castIds` json NOT NULL,
	`crewIds` json NOT NULL,
	`recommendedIds` json NOT NULL,
	`readAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `title_likeness_kind_catalogueId_pk` PRIMARY KEY(`kind`,`catalogueId`)
);
