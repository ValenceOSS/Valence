ALTER TABLE "user_profile" ADD COLUMN "colour" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "avatarStyle" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "avatarSeed" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "photoPath" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "onboardedAt" timestamp;--> statement-breakpoint
UPDATE "user_profile" SET "onboardedAt" = now() WHERE "onboardedAt" IS NULL;
