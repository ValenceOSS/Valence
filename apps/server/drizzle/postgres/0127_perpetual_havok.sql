CREATE TABLE "api_key_profile" (
	"keyId" text PRIMARY KEY NOT NULL,
	"profileId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_age_ceiling" (
	"profileId" text NOT NULL,
	"libraryId" text NOT NULL,
	"maximumAge" integer NOT NULL,
	"allowsUnrated" boolean DEFAULT false NOT NULL,
	"setAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_age_ceiling_profileId_libraryId_pk" PRIMARY KEY("profileId","libraryId"),
	CONSTRAINT "profile_age_ceiling_range" CHECK ("profile_age_ceiling"."maximumAge" between 0 and 21)
);
--> statement-breakpoint
CREATE TABLE "profile_library_block" (
	"profileId" text NOT NULL,
	"libraryId" text NOT NULL,
	"blockedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_library_block_profileId_libraryId_pk" PRIMARY KEY("profileId","libraryId")
);
--> statement-breakpoint
CREATE TABLE "session_profile" (
	"sessionId" text PRIMARY KEY NOT NULL,
	"profileId" text NOT NULL,
	"chosenAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "child_account" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "child_account" CASCADE;--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "profileId" text;--> statement-breakpoint
ALTER TABLE "share" ADD COLUMN "createdByProfileId" text;--> statement-breakpoint
ALTER TABLE "viewer_profile" ADD COLUMN "isOwner" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "viewer_profile" ADD COLUMN "pinHash" text;--> statement-breakpoint
ALTER TABLE "viewer_profile" ADD COLUMN "pinFailures" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "viewer_profile" ADD COLUMN "pinLockedUntil" timestamp;--> statement-breakpoint
ALTER TABLE "viewer_profile" ADD COLUMN "mayRequest" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "api_key_profile" ADD CONSTRAINT "api_key_profile_keyId_apikey_id_fk" FOREIGN KEY ("keyId") REFERENCES "public"."apikey"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key_profile" ADD CONSTRAINT "api_key_profile_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_age_ceiling" ADD CONSTRAINT "profile_age_ceiling_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_age_ceiling" ADD CONSTRAINT "profile_age_ceiling_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_library_block" ADD CONSTRAINT "profile_library_block_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_library_block" ADD CONSTRAINT "profile_library_block_libraryId_library_id_fk" FOREIGN KEY ("libraryId") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_profile" ADD CONSTRAINT "session_profile_sessionId_session_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_profile" ADD CONSTRAINT "session_profile_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profile_age_ceiling_library_idx" ON "profile_age_ceiling" USING btree ("libraryId");--> statement-breakpoint
CREATE INDEX "profile_library_block_library_idx" ON "profile_library_block" USING btree ("libraryId");--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share" ADD CONSTRAINT "share_createdByProfileId_viewer_profile_id_fk" FOREIGN KEY ("createdByProfileId") REFERENCES "public"."viewer_profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
UPDATE "viewer_profile" SET "isOwner" = true WHERE "id" IN (SELECT DISTINCT ON ("userId") "id" FROM "viewer_profile" ORDER BY "userId", "createdAt", "id");--> statement-breakpoint
INSERT INTO "api_key_profile" ("keyId", "profileId") SELECT k."id", p."id" FROM "apikey" k JOIN "viewer_profile" p ON p."userId" = k."referenceId" AND p."isOwner" = true;