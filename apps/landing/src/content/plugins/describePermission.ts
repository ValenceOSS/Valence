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
    case 'links':
      return `Fetches files from ${listInWords(permission.hosts)}`;
    case 'library':
      return permission.access === 'everything'
        ? 'Reads every library, locked ones included'
        : 'Reads your library';
    case 'viewing':
      if (permission.household === true) {
        return permission.access === 'write'
          ? 'Hears whenever anybody on the server watches or listens, and reads and updates what they have watched'
          : 'Hears whenever anybody on the server watches or listens, and reads what they have watched';
      }

      return permission.access === 'write'
        ? 'Reads what you have watched, kept and rated, and updates what you have watched'
        : 'Reads what you have watched, kept and rated';
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
    case 'webhooks':
      return 'Receives messages from outside services';
    case 'emits':
      return 'Tells your webhooks when things happen';
    case 'routes':
      return permission.public
        ? 'Answers anybody outside Valence'
        : 'Answers apps you sign in with an app password';
  }
};

export { describePermission };
