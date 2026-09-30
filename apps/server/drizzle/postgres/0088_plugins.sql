-- Plugins: what an administrator installed, the little each plugin may keep for itself, the
-- accounts somebody connected to one (their tokens sealed before they are written), and which
-- profiles have used it, which is who its scheduled work may act for.
CREATE TABLE "plugin_connection" (
	"pluginId" text NOT NULL,
	"profileId" text NOT NULL,
	"provider" text NOT NULL,
	"accessToken" text NOT NULL,
	"refreshToken" text,
	"expiresAt" timestamp,
	"account" text,
	"connectedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plugin_connection_pluginId_profileId_provider_pk" PRIMARY KEY("pluginId","profileId","provider")
);
--> statement-breakpoint
CREATE TABLE "plugin_installation" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"trust" text NOT NULL,
	"manifest" jsonb NOT NULL,
	"package" text NOT NULL,
	"sha256" text NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"installedBy" text,
	"installedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"problem" text
);
--> statement-breakpoint
CREATE TABLE "plugin_profile" (
	"pluginId" text NOT NULL,
	"profileId" text NOT NULL,
	"firstUsedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plugin_profile_pluginId_profileId_pk" PRIMARY KEY("pluginId","profileId")
);
--> statement-breakpoint
CREATE TABLE "plugin_storage" (
	"pluginId" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"bytes" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plugin_storage_pluginId_key_pk" PRIMARY KEY("pluginId","key")
);
--> statement-breakpoint
ALTER TABLE "plugin_connection" ADD CONSTRAINT "plugin_connection_pluginId_plugin_installation_id_fk" FOREIGN KEY ("pluginId") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_connection" ADD CONSTRAINT "plugin_connection_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_installation" ADD CONSTRAINT "plugin_installation_installedBy_user_id_fk" FOREIGN KEY ("installedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_profile" ADD CONSTRAINT "plugin_profile_pluginId_plugin_installation_id_fk" FOREIGN KEY ("pluginId") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_profile" ADD CONSTRAINT "plugin_profile_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_storage" ADD CONSTRAINT "plugin_storage_pluginId_plugin_installation_id_fk" FOREIGN KEY ("pluginId") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;