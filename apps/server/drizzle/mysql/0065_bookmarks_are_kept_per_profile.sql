CREATE TABLE `reading_bookmark` (
	`id` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`bookId` varchar(64) NOT NULL,
	`chapterId` varchar(64) NOT NULL,
	`pageNumber` int,
	`fraction` float,
	`pageShown` int,
	`excerpt` mediumtext,
	`picture` mediumtext,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `reading_bookmark_id` PRIMARY KEY(`id`),
	CONSTRAINT `reading_bookmark_somewhere` CHECK(`reading_bookmark`.`pageNumber` is not null or `reading_bookmark`.`fraction` is not null)
);
--> statement-breakpoint
ALTER TABLE `reading_bookmark` ADD CONSTRAINT `reading_bookmark_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_bookmark` ADD CONSTRAINT `reading_bookmark_bookId_book_id_fk` FOREIGN KEY (`bookId`) REFERENCES `book`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_bookmark` ADD CONSTRAINT `reading_bookmark_chapterId_book_chapter_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `book_chapter`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `reading_bookmark_book_id_idx` ON `reading_bookmark` (`bookId`);--> statement-breakpoint
CREATE INDEX `reading_bookmark_chapter_idx` ON `reading_bookmark` (`chapterId`);--> statement-breakpoint
CREATE INDEX `reading_bookmark_book_idx` ON `reading_bookmark` (`profileId`,`bookId`);