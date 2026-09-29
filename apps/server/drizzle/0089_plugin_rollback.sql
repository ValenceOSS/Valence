-- Plugins: the version an upgrade replaced, and a copy of what that version kept, so an upgrade
-- whose own data change fails can be undone, and an administrator can roll back once.
CREATE TABLE "plugin_previous" (
	"pluginId" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"trust" text NOT NULL,
	"manifest" jsonb NOT NULL,
	"package" text NOT NULL,
	"sha256" text NOT NULL,
	"storage" jsonb NOT NULL,
	"keptAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plugin_previous" ADD CONSTRAINT "plugin_previous_pluginId_plugin_installation_id_fk" FOREIGN KEY ("pluginId") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;