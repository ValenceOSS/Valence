CREATE TABLE `link_invite` (
	`id` varchar(64) NOT NULL,
	`codeHash` varchar(255) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`expiresAt` datetime(3) NOT NULL,
	`usedAt` datetime(3),
	CONSTRAINT `link_invite_id` PRIMARY KEY(`id`),
	CONSTRAINT `link_invite_code_idx` UNIQUE(`codeHash`)
);
--> statement-breakpoint
CREATE TABLE `linked_server` (
	`id` varchar(64) NOT NULL,
	`name` mediumtext NOT NULL,
	`colour` varchar(16) NOT NULL,
	`address` mediumtext NOT NULL,
	`publicKey` json NOT NULL,
	`fingerprint` varchar(64) NOT NULL,
	`state` varchar(32) NOT NULL,
	`theirPairingId` varchar(64),
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`linkedAt` datetime(3),
	`lastSeenAt` datetime(3),
	CONSTRAINT `linked_server_id` PRIMARY KEY(`id`),
	CONSTRAINT `linked_server_fingerprint_idx` UNIQUE(`fingerprint`),
	CONSTRAINT `linked_server_state` CHECK(`linked_server`.`state` in ('awaitingThem', 'awaitingUs', 'linked', 'refused', 'unlinkedByThem'))
);
