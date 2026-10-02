import { z } from 'zod';

const PERMISSIONS = [
  'administrator',

  'library.create',
  'library.edit',
  'library.delete',

  'jobs.run',
  'jobs.schedule',
  'jobs.runDestructive',

  'media.rescan',
  'media.delete',
  'media.reencode',
  'media.override',
  'media.artwork',
  'media.hide',

  'sharing.link',
  'sharing.party',
  'sharing.manage',

  'streaming.view',
  'streaming.stop',
  'streaming.pause',
  'streaming.message',

  'download.media',

  'requests.ask',
  'requests.askMusic',
  'requests.autoApprove',
  'requests.viewAll',
  'requests.approve',
  'requests.manage',

  'account.keys',

  'account.invite',
  'account.manage',
  'account.ban',
  'account.roles',
  'account.profiles',
  'account.security',

  'server.settings',
  'server.backup',
  'server.logs',
  'server.monitor',
  'server.webhooks',
  'server.plugins',
  'server.links',
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
  permissions: z.array(GrantedPermissionSchema),
  isAdministrator: z.boolean(),
});

type Permission = (typeof PERMISSIONS)[number];
type PermissionGrant = z.infer<typeof PermissionGrantSchema>;
type PluginNode = z.infer<typeof PluginNodeSchema>;
type GrantedPermission = z.infer<typeof GrantedPermissionSchema>;
type Role = z.infer<typeof RoleSchema>;
type MyPermissions = z.infer<typeof MyPermissionsSchema>;

export {
  PERMISSIONS,
  PermissionSchema,
  PermissionGrantSchema,
  PluginNodeSchema,
  GrantedPermissionSchema,
  RoleSchema,
  MyPermissionsSchema,
  ADMINISTRATOR,
};

export type { GrantedPermission, MyPermissions, Permission, PermissionGrant, PluginNode, Role };
