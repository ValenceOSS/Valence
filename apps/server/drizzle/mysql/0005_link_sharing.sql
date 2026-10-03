CREATE TABLE `federation_audit` (
	`id` varchar(64) NOT NULL,
	`linkedServerId` varchar(64) NOT NULL,
	`remotePersonId` varchar(64),
	`action` varchar(32) NOT NULL,
	`mediaId` varchar(64),
	`mediaTitle` mediumtext,
	`outcome` varchar(32) NOT NULL,
	`count` int NOT NULL DEFAULT 1,
	`sameEventKey` varchar(191) NOT NULL,
	`at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `federation_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `link_grant` (
	`linkedServerId` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`grantedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `link_grant_linkedServerId_libraryId_pk` PRIMARY KEY(`linkedServerId`,`libraryId`)
);
--> statement-breakpoint
CREATE TABLE `remote_person` (
	`id` varchar(64) NOT NULL,
	`linkedServerId` varchar(64) NOT NULL,
	`pseudonym` varchar(64) NOT NULL,
	`name` mediumtext,
	`firstSeenAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`lastSeenAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`blockedAt` datetime(3),
	CONSTRAINT `remote_person_id` PRIMARY KEY(`id`),
	CONSTRAINT `remote_person_pseudonym_idx` UNIQUE(`linkedServerId`,`pseudonym`)
);
--> statement-breakpoint
ALTER TABLE `linked_server` ADD `maximumAge` int;--> statement-breakpoint
ALTER TABLE `linked_server` ADD `allowsUnrated` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `linked_server` ADD `namesTravel` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `linked_server` ADD `showsActivity` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `federation_audit` ADD CONSTRAINT `federation_audit_linkedServerId_linked_server_id_fk` FOREIGN KEY (`linkedServerId`) REFERENCES `linked_server`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `federation_audit` ADD CONSTRAINT `federation_audit_remotePersonId_remote_person_id_fk` FOREIGN KEY (`remotePersonId`) REFERENCES `remote_person`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `link_grant` ADD CONSTRAINT `link_grant_linkedServerId_linked_server_id_fk` FOREIGN KEY (`linkedServerId`) REFERENCES `linked_server`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `link_grant` ADD CONSTRAINT `link_grant_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `remote_person` ADD CONSTRAINT `remote_person_linkedServerId_linked_server_id_fk` FOREIGN KEY (`linkedServerId`) REFERENCES `linked_server`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `federation_audit_server_idx` ON `federation_audit` (`linkedServerId`,`at`);--> statement-breakpoint
CREATE INDEX `federation_audit_same_event_idx` ON `federation_audit` (`sameEventKey`,`at`);--> statement-breakpoint
CREATE INDEX `link_grant_library_idx` ON `link_grant` (`libraryId`);