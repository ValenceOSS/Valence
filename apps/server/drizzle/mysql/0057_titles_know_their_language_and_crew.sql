ALTER TABLE `library` ADD `metadataLanguage` mediumtext;--> statement-breakpoint
ALTER TABLE `library` ADD `usesOriginalTitle` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `media_item` ADD `originalLanguage` mediumtext;--> statement-breakpoint
ALTER TABLE `media_item` ADD `countries` json;--> statement-breakpoint
ALTER TABLE `media_item` ADD `creators` json;--> statement-breakpoint
ALTER TABLE `media_item` ADD `directors` json;--> statement-breakpoint
ALTER TABLE `media_item` ADD `writers` json;--> statement-breakpoint
ALTER TABLE `media_item` ADD `guestStars` json;