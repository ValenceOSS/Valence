UPDATE "viewer_profile" SET
	"photoPath" = "user_profile"."photoPath",
	"avatarStyle" = CASE WHEN "user_profile"."photoPath" IS NULL THEN "user_profile"."avatarStyle" END,
	"avatarSeed" = CASE WHEN "user_profile"."photoPath" IS NULL THEN "user_profile"."avatarSeed" END,
	"avatarLook" = NULL,
	"updatedAt" = now()
FROM "user_profile"
WHERE "user_profile"."userId" = "viewer_profile"."userId"
	AND "viewer_profile"."userId" IN (SELECT "userId" FROM "viewer_profile" GROUP BY "userId" HAVING COUNT(*) = 1)
	AND ("user_profile"."photoPath" IS NOT NULL OR ("user_profile"."avatarStyle" IS NOT NULL AND "user_profile"."avatarSeed" IS NOT NULL))
	AND "viewer_profile"."photoPath" IS NULL
	AND "viewer_profile"."avatarStyle" IS NULL
	AND ("viewer_profile"."avatarLook" IS NULL OR "viewer_profile"."avatarLook"->>'kind' = 'initial');
--> statement-breakpoint
UPDATE "user_profile" SET
	"displayName" = NULL,
	"colour" = NULL,
	"avatarStyle" = NULL,
	"avatarSeed" = NULL,
	"photoPath" = NULL,
	"updatedAt" = now()
WHERE "userId" IN (SELECT "userId" FROM "viewer_profile" GROUP BY "userId" HAVING COUNT(*) = 1)
	AND ("displayName" IS NOT NULL OR "colour" IS NOT NULL OR "avatarStyle" IS NOT NULL OR "avatarSeed" IS NOT NULL OR "photoPath" IS NOT NULL);
