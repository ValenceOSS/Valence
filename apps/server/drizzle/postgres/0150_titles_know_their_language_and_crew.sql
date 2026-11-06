ALTER TABLE "library" ADD COLUMN "metadataLanguage" text;--> statement-breakpoint
ALTER TABLE "library" ADD COLUMN "usesOriginalTitle" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "originalLanguage" text;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "countries" jsonb;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "creators" jsonb;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "directors" jsonb;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "writers" jsonb;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "guestStars" jsonb;