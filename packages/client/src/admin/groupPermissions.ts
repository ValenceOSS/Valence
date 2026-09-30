import type { Permission } from '@ValenceContracts/schemas/Permission';
import { say } from '@ValenceI18n/say';

type PermissionGroup = {
  id: string;
  label: string;
  permissions: Permission[];
};

const GROUP_LABELS: Record<string, string> = {
  administrator: say('common.everything'),
  library: say('common.libraries'),
  jobs: say('common.jobs'),
  media: say('common.media'),
  sharing: say('client.admin.groupPermissions.sharing'),
  streaming: say('client.admin.groupPermissions.streaming'),
  download: say('common.downloads'),
  requests: say('common.requests'),
  account: say('common.accounts'),
  server: say('common.server'),
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

    if (existing === undefined) {
      groups.push({ id, label: GROUP_LABELS[id] ?? id, permissions: [permission] });
    } else {
      existing.permissions.push(permission);
    }
  }

  return groups;
};

export { groupPermissions };
