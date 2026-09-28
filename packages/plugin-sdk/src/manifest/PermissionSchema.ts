import { z } from 'zod';
import { AccountProviderSchema } from './AccountProviderSchema';
import { HostnameSchema } from './HostnameSchema';

const MAX_STORAGE_BYTES = 50_000_000;

const PermissionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('network'),
    hosts: z.array(HostnameSchema).min(1).max(20),
  }),
  z.object({ kind: z.literal('library'), access: z.literal('read') }),
  z.object({ kind: z.literal('viewing'), access: z.enum(['read', 'write']) }),
  z.object({ kind: z.literal('requests'), access: z.literal('create') }),
  z.object({ kind: z.literal('playlists'), access: z.enum(['read', 'write']) }),
  z.object({
    kind: z.literal('storage'),
    quotaBytes: z.number().int().positive().max(MAX_STORAGE_BYTES),
  }),
  z.object({
    kind: z.literal('accounts'),
    providers: z.array(AccountProviderSchema).min(1).max(4),
  }),
  z.object({ kind: z.literal('notifications') }),
]);

type Permission = z.infer<typeof PermissionSchema>;

type PermissionKind = Permission['kind'];

export type { Permission, PermissionKind };

export { PermissionSchema };
