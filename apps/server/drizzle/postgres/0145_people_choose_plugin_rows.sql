CREATE TABLE "plugin_home_row" (
	"pluginId" text NOT NULL,
	"profileId" text NOT NULL,
	"rowId" text NOT NULL,
	"chosenAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plugin_home_row_pluginId_profileId_rowId_pk" PRIMARY KEY("pluginId","profileId","rowId")
);
--> statement-breakpoint
ALTER TABLE "plugin_home_row" ADD CONSTRAINT "plugin_home_row_pluginId_plugin_installation_id_fk" FOREIGN KEY ("pluginId") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_home_row" ADD CONSTRAINT "plugin_home_row_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;