CREATE TABLE "plugin_credential" (
	"id" text PRIMARY KEY NOT NULL,
	"pluginId" text NOT NULL,
	"profileId" text NOT NULL,
	"login" text NOT NULL,
	"label" text NOT NULL,
	"secretHash" text NOT NULL,
	"sealedSecret" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastUsedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "plugin_credential" ADD CONSTRAINT "plugin_credential_pluginId_plugin_installation_id_fk" FOREIGN KEY ("pluginId") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_credential" ADD CONSTRAINT "plugin_credential_profileId_viewer_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."viewer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "plugin_credential_login_idx" ON "plugin_credential" USING btree ("pluginId","login");--> statement-breakpoint
CREATE UNIQUE INDEX "plugin_credential_secret_idx" ON "plugin_credential" USING btree ("secretHash");--> statement-breakpoint
CREATE INDEX "plugin_credential_profile_idx" ON "plugin_credential" USING btree ("profileId");