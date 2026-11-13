ALTER TABLE `webhook_subscription` ADD `reachesLocalNetwork` boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `webhook_subscription` SET `reachesLocalNetwork` = true;
