ALTER TABLE "episode_pin" DROP CONSTRAINT "episode_pin_libraryId_path_pk";--> statement-breakpoint
ALTER TABLE "extra_choice" DROP CONSTRAINT "extra_choice_libraryId_path_pk";--> statement-breakpoint
ALTER TABLE "version_choice" DROP CONSTRAINT "version_choice_libraryId_path_pk";--> statement-breakpoint
CREATE UNIQUE INDEX "episode_pin_path_idx" ON "episode_pin" USING btree ("libraryId","path");--> statement-breakpoint
CREATE UNIQUE INDEX "extra_choice_path_idx" ON "extra_choice" USING btree ("libraryId","path");--> statement-breakpoint
CREATE UNIQUE INDEX "version_choice_path_idx" ON "version_choice" USING btree ("libraryId","path");