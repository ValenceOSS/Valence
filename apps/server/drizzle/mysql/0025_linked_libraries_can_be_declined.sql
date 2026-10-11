CREATE TABLE `link_decline` (
	`linkedServerId` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`declinedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `link_decline_linkedServerId_libraryId_pk` PRIMARY KEY(`linkedServerId`,`libraryId`)
);
--> statement-breakpoint
ALTER TABLE `link_decline` ADD CONSTRAINT `link_decline_linkedServerId_linked_server_id_fk` FOREIGN KEY (`linkedServerId`) REFERENCES `linked_server`(`id`) ON DELETE cascade ON UPDATE no action;