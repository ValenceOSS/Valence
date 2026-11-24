import { z } from 'zod';

const PERMISSIONS = [
  'administrator',

  'download.media',
  'media.subtitles',
  'sources.play',

  'sharing.link',
  'sharing.party',

  'requests.ask',
  'requests.askMusic',
  'requests.viewAll',
  'requests.autoApprove',

  'account.keys',

  'requests.approve',
  'requests.manage',

  'sharing.manage',

  'streaming.view',
  'streaming.control',

  'media.override',
  'media.reencode',
  'media.delete',

  'library.edit',
  'library.delete',

  'jobs.run',
  'jobs.runDestructive',

  'account.invite',
  'account.manage',
  'account.roles',

  'server.monitor',
  'server.settings',
  'server.plugins',
  'server.links',
  'server.backup',
] as const;

const PermissionSchema = z.enum(PERMISSIONS);

const ADMINISTRATOR: Permission = 'administrator';

const PluginNodeSchema = z.templateLiteral([
  'plugin.',
  z.string().regex(/^[a-z][a-z0-9-]{2,63}$/),
  '.',
  z.string().regex(/^[a-z][a-z0-9-]{0,39}$/),
]);

const GrantedPermissionSchema = z.union([PermissionSchema, PluginNodeSchema]);

const RETIRED_PERMISSION_NAMES = [
  'library.create',
  'jobs.schedule',
  'media.rescan',
  'media.artwork',
  'media.hide',
  'streaming.stop',
  'streaming.pause',
  'streaming.message',
  'account.ban',
  'account.security',
  'account.profiles',
  'server.logs',
  'server.webhooks',
] as const;

const RETIRED_PERMISSIONS: Readonly<
  Record<(typeof RETIRED_PERMISSION_NAMES)[number], (typeof PERMISSIONS)[number]>
> = {
  'library.create': 'library.edit',
  'jobs.schedule': 'jobs.run',
  'media.rescan': 'media.override',
  'media.artwork': 'media.override',
  'media.hide': 'media.override',
  'streaming.stop': 'streaming.control',
  'streaming.pause': 'streaming.control',
  'streaming.message': 'streaming.control',
  'account.ban': 'account.manage',
  'account.security': 'account.manage',
  'account.profiles': 'account.manage',
  'server.logs': 'server.monitor',
  'server.webhooks': 'server.settings',
};

const CARRIED_OVER_PERMISSION_NAMES = [
  'library.create',
  'jobs.schedule',
  'media.rescan',
  'media.artwork',
  'media.hide',
  'streaming.stop',
  'streaming.pause',
  'streaming.message',
  'server.logs',
] as const satisfies readonly (typeof RETIRED_PERMISSION_NAMES)[number][];

const RetiredPermissionSchema = z
  .enum(CARRIED_OVER_PERMISSION_NAMES)
  .transform((retired) => RETIRED_PERMISSIONS[retired]);

const PermissionOrRetiredSchema = z.union([PermissionSchema, RetiredPermissionSchema]);

const GrantedPermissionOrRetiredSchema = z.union([
  PermissionSchema,
  RetiredPermissionSchema,
  PluginNodeSchema,
]);

const PermissionsReadSchema = z.array(z.string()).transform((names) => [
  ...new Set(
    names.flatMap((name) => {
      const known = PermissionOrRetiredSchema.safeParse(name);

      return known.success ? [known.data] : [];
    }),
  ),
]);

const GrantedPermissionsReadSchema = z.array(z.string()).transform((names) => [
  ...new Set(
    names.flatMap((name) => {
      const known = GrantedPermissionOrRetiredSchema.safeParse(name);

      return known.success ? [known.data] : [];
    }),
  ),
]);

const PermissionGrantSchema = z.object({
  permission: PermissionSchema,
  effect: z.enum(['allow', 'deny']),
});

const RoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(60),
  position: z.number().int().nonnegative(),
  permissions: z.array(GrantedPermissionSchema),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .nullable(),
});

const MyPermissionsSchema = z.object({
  permissions: z.array(z.union([GrantedPermissionSchema, z.enum(RETIRED_PERMISSION_NAMES)])),
  newerPermissions: z.array(GrantedPermissionSchema).default([]),
  isAdministrator: z.boolean(),
  isDemo: z.boolean().optional(),
});

const MyPermissionsReadSchema = z
  .object({
    permissions: z.array(z.string()),
    newerPermissions: z.array(z.string()).default([]),
    isAdministrator: z.boolean(),
    isDemo: z.boolean().optional(),
  })
  .transform(({ permissions, newerPermissions, ...rest }) => ({
    ...rest,
    permissions: [
      ...new Set(
        [...permissions, ...newerPermissions].flatMap((named) => {
          const known = GrantedPermissionOrRetiredSchema.safeParse(named);

          return known.success ? [known.data] : [];
        }),
      ),
    ],
  }));

type Permission = (typeof PERMISSIONS)[number];

const SEES_EVERY_REQUEST: readonly Permission[] = [
  'requests.viewAll',
  'requests.approve',
  'requests.manage',
];
type PermissionGrant = z.infer<typeof PermissionGrantSchema>;
type PluginNode = z.infer<typeof PluginNodeSchema>;
type GrantedPermission = z.infer<typeof GrantedPermissionSchema>;
type Role = z.infer<typeof RoleSchema>;
type MyPermissions = z.output<typeof MyPermissionsReadSchema>;

export {
  PERMISSIONS,
  RETIRED_PERMISSIONS,
  RETIRED_PERMISSION_NAMES,
  PermissionOrRetiredSchema,
  GrantedPermissionOrRetiredSchema,
  PermissionsReadSchema,
  GrantedPermissionsReadSchema,
  PermissionSchema,
  PermissionGrantSchema,
  PluginNodeSchema,
  GrantedPermissionSchema,
  RoleSchema,
  MyPermissionsSchema,
  MyPermissionsReadSchema,
  ADMINISTRATOR,
  SEES_EVERY_REQUEST,
};

export type { GrantedPermission, MyPermissions, Permission, PermissionGrant, PluginNode, Role };
