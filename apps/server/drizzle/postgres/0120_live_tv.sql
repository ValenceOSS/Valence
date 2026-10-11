CREATE TABLE "live_channel" (
	"id" text PRIMARY KEY NOT NULL,
	"sourceId" text NOT NULL,
	"position" integer NOT NULL,
	"number" text,
	"name" text NOT NULL,
	"groupName" text,
	"logoUrl" text,
	"guideId" text,
	"streamUrl" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_favourite" (
	"profileId" text NOT NULL,
	"channelId" text NOT NULL,
	"keptAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "live_favourite_profileId_channelId_pk" PRIMARY KEY("profileId","channelId")
);
--> statement-breakpoint
CREATE TABLE "live_programme" (
	"id" text PRIMARY KEY NOT NULL,
	"sourceId" text NOT NULL,
	"guideId" text NOT NULL,
	"startsAt" timestamp NOT NULL,
	"endsAt" timestamp NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"category" text
);
--> statement-breakpoint
CREATE TABLE "live_source" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"address" text,
	"guideUrl" text,
	"logoUrl" text,
	"playlist" text,
	"channelCount" integer DEFAULT 0 NOT NULL,
	"refreshedAt" timestamp,
	"problem" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "live_channel" ADD CONSTRAINT "live_channel_sourceId_live_source_id_fk" FOREIGN KEY ("sourceId") REFERENCES "public"."live_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_favourite" ADD CONSTRAINT "live_favourite_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_favourite" ADD CONSTRAINT "live_favourite_channelId_live_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."live_channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_programme" ADD CONSTRAINT "live_programme_sourceId_live_source_id_fk" FOREIGN KEY ("sourceId") REFERENCES "public"."live_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "live_channel_source_idx" ON "live_channel" USING btree ("sourceId","position");--> statement-breakpoint
CREATE INDEX "live_programme_channel_idx" ON "live_programme" USING btree ("sourceId","guideId","startsAt");--> statement-breakpoint
CREATE INDEX "live_programme_ends_idx" ON "live_programme" USING btree ("endsAt");