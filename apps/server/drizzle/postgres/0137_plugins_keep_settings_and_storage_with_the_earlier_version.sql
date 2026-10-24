CREATE TABLE "plugin_previous_storage" (
	"pluginId" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"bytes" integer NOT NULL,
	CONSTRAINT "plugin_previous_storage_pluginId_key_pk" PRIMARY KEY("pluginId","key")
);
--> statement-breakpoint
ALTER TABLE "plugin_previous" ADD COLUMN "settings" jsonb;--> statement-breakpoint
ALTER TABLE "plugin_previous_storage" ADD CONSTRAINT "plugin_previous_storage_pluginId_plugin_installation_id_fk" FOREIGN KEY ("pluginId") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;