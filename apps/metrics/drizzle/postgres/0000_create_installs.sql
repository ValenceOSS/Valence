CREATE TABLE "daily_installs" (
	"day" date NOT NULL,
	"install_id" uuid NOT NULL,
	"version" text NOT NULL,
	CONSTRAINT "daily_installs_day_install_id_pk" PRIMARY KEY("day","install_id")
);
--> statement-breakpoint
CREATE TABLE "installs" (
	"install_id" uuid PRIMARY KEY NOT NULL,
	"first_seen" timestamp with time zone NOT NULL,
	"last_seen" timestamp with time zone NOT NULL,
	"report" jsonb NOT NULL,
	"version" text NOT NULL,
	"install_method" text NOT NULL,
	"platform" text NOT NULL,
	"arch" text NOT NULL,
	"cpu_model" text NOT NULL,
	"cores" integer NOT NULL,
	"memory_gb" text NOT NULL,
	"database" text NOT NULL,
	"gpus" jsonb NOT NULL,
	"accels" jsonb NOT NULL,
	"library" jsonb NOT NULL,
	"clients" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_installs" ADD CONSTRAINT "daily_installs_install_id_installs_install_id_fk" FOREIGN KEY ("install_id") REFERENCES "public"."installs"("install_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "installs_last_seen" ON "installs" USING btree ("last_seen");