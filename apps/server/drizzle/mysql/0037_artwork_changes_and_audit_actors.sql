ALTER TABLE `media_item` ADD `artworkChangedAt` datetime(3);--> statement-breakpoint
CREATE INDEX `audit_entry_actor_idx` ON `audit_entry` (`actorId`,`at`);