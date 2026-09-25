import type { Permission } from '@ValenceContracts/schemas/Permission';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

type PermissionGroup = {
  id: string;
  label: string;
  permissions: Permission[];
};

const GROUP_LABELS: Record<string, StringKey> = {
  administrator: 'client.groupPermissions.administrator',
  library: 'client.groupPermissions.library',
  jobs: 'client.groupPermissions.jobs',
  media: 'client.groupPermissions.media',
  sharing: 'client.groupPermissions.sharing',
  streaming: 'client.groupPermissions.streaming',
  download: 'client.groupPermissions.download',
  requests: 'client.groupPermissions.requests',
  account: 'client.groupPermissions.account',
  server: 'client.groupPermissions.server',
};

/**
 * Arranges the permission catalogue the way somebody choosing from it reads it — by the thing being
 * permitted rather than in the order the server happens to list them, so that everything about
 * libraries sits together.
 *
 * @param permissions The catalogue, as the server gave it.
 */
const groupPermissions = (permissions: readonly Permission[]): PermissionGroup[] => {
  const groups: PermissionGroup[] = [];

  for (const permission of permissions) {
    const id = permission.split('.')[0] ?? permission;
    const existing = groups.find((group) => group.id === id);
    const label = GROUP_LABELS[id];

    if (existing === undefined) {
      groups.push({ id, label: label === undefined ? id : say(label), permissions: [permission] });
    } else {
      existing.permissions.push(permission);
    }
  }

  return groups;
};

export { groupPermissions };
