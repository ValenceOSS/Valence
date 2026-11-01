CREATE TABLE "device_name" (
	"userId" text NOT NULL,
	"deviceId" text NOT NULL,
	"name" text NOT NULL,
	"renamedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_name_userId_deviceId_pk" PRIMARY KEY("userId","deviceId")
);
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "deviceId" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "device" jsonb;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "lastActiveAt" timestamp;--> statement-breakpoint
ALTER TABLE "device_name" ADD CONSTRAINT "device_name_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;