import type { Permission } from '@ValenceSDK/manifest/PermissionSchema';
import type { PermissionSummary } from './PermissionSummary';

/**
 * Condenses a plugin's permissions into the few things a visitor cares about — whose accounts it
 * connects to and which of their things in Valence it touches — as short labels. The plumbing that
 * comes with nearly every plugin, such as which sites it talks to, its own storage and sending
 * notifications, is left for anybody who opens the details, where every permission is listed in
 * full. Two permissions that say the same thing are said once.
 *
 * @param permissions - Everything the plugin's manifest asks for.
 * @returns The short labels, in the order the manifest gives them.
 */
const summarisePermissions = (permissions: readonly Permission[]): PermissionSummary[] => {
  const summaries = permissions.flatMap((permission): PermissionSummary[] => {
    switch (permission.kind) {
      case 'accounts':
        return permission.providers.map((provider) => ({
          id: `account-${provider.id}`,
          kind: 'account',
          label: `Your ${provider.name} account`,
        }));
      case 'library':
        return [{ id: 'library', kind: 'library', label: 'Your library' }];
      case 'viewing':
        return [
          {
            id: 'viewing',
            kind: 'viewing',
            label: permission.access === 'write' ? 'Updates what you watched' : 'What you watched',
          },
        ];
      case 'playlists':
        return [
          {
            id: 'playlists',
            kind: 'playlists',
            label: permission.access === 'write' ? 'Makes playlists' : 'Your playlists',
          },
        ];
      case 'requests':
        return [{ id: 'requests', kind: 'requests', label: 'Requests titles' }];
      case 'notifications':
      case 'network':
      case 'storage':
      case 'webhooks':
      case 'emits':
        return [];
    }
  });

  return summaries.filter(
    (summary, index) => summaries.findIndex((other) => other.id === summary.id) === index,
  );
};

export { summarisePermissions };
