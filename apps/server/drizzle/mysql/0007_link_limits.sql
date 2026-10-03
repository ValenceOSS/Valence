ALTER TABLE `linked_server` ADD `mostStreams` int;--> statement-breakpoint
ALTER TABLE `linked_server` ADD `qualityCeiling` varchar(16);--> statement-breakpoint
ALTER TABLE `linked_server` ADD `takesTheirControls` boolean DEFAULT true NOT NULL;