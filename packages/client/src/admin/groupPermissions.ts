import type { Permission } from '@ValenceContracts/schemas/Permission';
import { say } from '@ValenceI18n/say';

type PermissionGroup = {
  id: string;
  label: string;
  isAdmin: boolean;
  permissions: Permission[];
};

const GROUP_OF: Partial<Record<Permission, string>> = {
  'download.media': 'watching',
  'media.subtitles': 'watching',
  'sources.play': 'watching',
  'account.keys': 'own',
  'requests.approve': 'requestsAdmin',
  'requests.manage': 'requestsAdmin',
  'sharing.manage': 'sharingAdmin',
};

const ADMIN_GROUPS: ReadonlySet<string> = new Set([
  'requestsAdmin',
  'sharingAdmin',
  'streaming',
  'media',
  'library',
  'jobs',
  'account',
  'server',
]);

const GROUP_LABELS: Record<string, string> = {
  administrator: say('common.everything'),
  library: say('common.libraries'),
  jobs: say('common.jobs'),
  media: say('common.media'),
  sharing: say('client.admin.groupPermissions.sharing'),
  streaming: say('client.admin.groupPermissions.streaming'),
  requests: say('common.requests'),
  requestsAdmin: say('common.requests'),
  sharingAdmin: say('client.admin.groupPermissions.sharing'),
  account: say('common.accounts'),
  own: say('client.admin.groupPermissions.theirOwnAccount'),
  watching: say('common.watching'),
  server: say('common.server'),
};

/**
 * Arranges the permission catalogue the way somebody choosing from it reads it — by the thing being
 * permitted rather than in the order the server happens to list them, so that everything about
 * libraries sits together, and what is about running the server is told apart from what is about
 * watching on it.
 *
 * @param permissions The catalogue, as the server gave it.
 */
const groupPermissions = (permissions: readonly Permission[]): PermissionGroup[] => {
  const groups: PermissionGroup[] = [];

  for (const permission of permissions) {
    const id = GROUP_OF[permission] ?? permission.split('.')[0] ?? permission;
    const existing = groups.find((group) => group.id === id);

    if (existing === undefined) {
      groups.push({
        id,
        label: GROUP_LABELS[id] ?? id,
        isAdmin: ADMIN_GROUPS.has(id),
        permissions: [permission],
      });
    } else {
      existing.permissions.push(permission);
    }
  }

  return groups;
};

export { groupPermissions };
