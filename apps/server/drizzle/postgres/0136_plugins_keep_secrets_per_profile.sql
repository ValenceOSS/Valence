CREATE TABLE "plugin_secret" (
	"pluginId" text NOT NULL,
	"profileId" text NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plugin_secret_pluginId_profileId_key_pk" PRIMARY KEY("pluginId","profileId","key")
);
--> statement-breakpoint
ALTER TABLE "plugin_secret" ADD CONSTRAINT "plugin_secret_pluginId_plugin_installation_id_fk" FOREIGN KEY ("pluginId") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_secret" ADD CONSTRAINT "plugin_secret_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;