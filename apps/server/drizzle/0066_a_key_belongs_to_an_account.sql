DELETE FROM "apikey" WHERE "referenceId" NOT IN (SELECT "id" FROM "user");--> statement-breakpoint
DELETE FROM "deviceCode" WHERE "userId" IS NOT NULL AND "userId" NOT IN (SELECT "id" FROM "user");--> statement-breakpoint
ALTER TABLE "apikey" ADD CONSTRAINT "apikey_referenceId_user_id_fk" FOREIGN KEY ("referenceId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deviceCode" ADD CONSTRAINT "deviceCode_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
