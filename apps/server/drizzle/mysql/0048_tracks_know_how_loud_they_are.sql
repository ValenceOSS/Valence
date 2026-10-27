ALTER TABLE `music_track` ADD `trackGainDb` double;--> statement-breakpoint
ALTER TABLE `music_track` ADD `trackPeak` double;--> statement-breakpoint
ALTER TABLE `music_track` ADD `albumGainDb` double;--> statement-breakpoint
ALTER TABLE `music_track` ADD `albumPeak` double;--> statement-breakpoint
ALTER TABLE `music_track` ADD `loudnessTriedAt` datetime(3);