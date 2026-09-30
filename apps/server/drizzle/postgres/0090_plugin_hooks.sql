-- Plugins: the private address each webhook a plugin receives on has, one secret per hook per
-- install, so an outside service can reach that plugin and nothing else.
CREATE TABLE "plugin_hook" (
	"pluginId" text NOT NULL,
	"hookId" text NOT NULL,
	"secret" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plugin_hook_pluginId_hookId_pk" PRIMARY KEY("pluginId","hookId")
);
--> statement-breakpoint
ALTER TABLE "plugin_hook" ADD CONSTRAINT "plugin_hook_pluginId_plugin_installation_id_fk" FOREIGN KEY ("pluginId") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;