import type { Permission } from '@ValenceSDK/manifest/PermissionSchema';
import { listInWords } from './listInWords';

const MEGABYTE = 1_000_000;

/**
 * Says what a plugin permission lets it do, in the words a visitor would use rather than the
 * manifest's own, so the listing reads as a promise about the plugin rather than a schema.
 *
 * @param permission - One permission from the plugin's manifest.
 * @returns A short sentence.
 */
const describePermission = (permission: Permission): string => {
  switch (permission.kind) {
    case 'network':
      return `Talks to ${listInWords(permission.hosts)}`;
    case 'library':
      return 'Reads your library';
    case 'viewing':
      return permission.access === 'write'
        ? 'Reads and updates what you have watched'
        : 'Reads what you have watched';
    case 'requests':
      return 'Asks for titles you do not have yet';
    case 'playlists':
      return permission.access === 'write' ? 'Creates and fills playlists' : 'Reads your playlists';
    case 'storage':
      return `Keeps up to ${Math.max(1, Math.round(permission.quotaBytes / MEGABYTE)).toString()} MB of its own data`;
    case 'accounts':
      return `Connects to your ${listInWords(permission.providers.map((provider) => provider.name))} account`;
    case 'notifications':
      return 'Sends you notifications';
  }
};

export { describePermission };
