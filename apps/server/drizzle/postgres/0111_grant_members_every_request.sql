INSERT INTO "role_permission" ("roleId", "permission")
SELECT "role"."id", 'requests.viewAll'
FROM "role"
WHERE "role"."name" = 'Member'
ON CONFLICT DO NOTHING;
