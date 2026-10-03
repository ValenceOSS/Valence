ALTER TABLE "linked_server" ADD COLUMN "mostStreams" integer;--> statement-breakpoint
ALTER TABLE "linked_server" ADD COLUMN "qualityCeiling" text;--> statement-breakpoint
ALTER TABLE "linked_server" ADD COLUMN "takesTheirControls" boolean DEFAULT true NOT NULL;