INSERT INTO "role_permission" ("roleId", "permission")
SELECT "role"."id", "granted"."permission"
FROM "role"
JOIN (
  VALUES
    ('Member', 'requests.ask'),
    ('Member', 'requests.askMusic'),
    ('Manager', 'requests.ask'),
    ('Manager', 'requests.askMusic'),
    ('Manager', 'requests.autoApprove'),
    ('Manager', 'requests.viewAll'),
    ('Manager', 'requests.approve')
) AS "granted" ("roleName", "permission") ON "granted"."roleName" = "role"."name"
ON CONFLICT DO NOTHING;
