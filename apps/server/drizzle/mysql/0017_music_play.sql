CREATE TABLE `music_play` (
	`id` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`trackId` varchar(64) NOT NULL,
	`playedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `music_play_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `music_play` ADD CONSTRAINT `music_play_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `music_play` ADD CONSTRAINT `music_play_trackId_music_track_mediaItemId_fk` FOREIGN KEY (`trackId`) REFERENCES `music_track`(`mediaItemId`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `music_play_recent_idx` ON `music_play` (`profileId`,`playedAt`);--> statement-breakpoint
CREATE INDEX `music_play_track_idx` ON `music_play` (`profileId`,`trackId`);