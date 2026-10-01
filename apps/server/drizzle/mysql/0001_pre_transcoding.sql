CREATE TABLE `pre_transcode_refusal` (
	`mediaItemId` varchar(64) NOT NULL,
	`target` mediumtext NOT NULL,
	`code` varchar(64) NOT NULL,
	`detail` json NOT NULL,
	`refusedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `pre_transcode_refusal_mediaItemId` PRIMARY KEY(`mediaItemId`)
);
--> statement-breakpoint
ALTER TABLE `reencode_request` ADD `container` varchar(8);--> statement-breakpoint
ALTER TABLE `reencode_request` ADD `maxBitrateKbps` int;--> statement-breakpoint
ALTER TABLE `reencode_request` ADD `placement` varchar(16) DEFAULT 'hidden' NOT NULL;--> statement-breakpoint
ALTER TABLE `reencode_request` ADD `origin` varchar(16) DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE `pre_transcode_refusal` ADD CONSTRAINT `pre_transcode_refusal_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reencode_request` ADD CONSTRAINT `reencode_request_container` CHECK (`reencode_request`.`container` in ('mp4', 'mkv'));--> statement-breakpoint
ALTER TABLE `reencode_request` ADD CONSTRAINT `reencode_request_placement` CHECK (`reencode_request`.`placement` in ('hidden', 'beside'));--> statement-breakpoint
ALTER TABLE `reencode_request` ADD CONSTRAINT `reencode_request_origin` CHECK (`reencode_request`.`origin` in ('admin', 'preTranscode'));--> statement-breakpoint
CREATE INDEX `reencode_request_origin_idx` ON `reencode_request` (`origin`,`state`);