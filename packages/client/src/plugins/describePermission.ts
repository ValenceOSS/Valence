import type { Permission } from '@ValenceSDK/manifest/PermissionSchema';

/**
 * What a permission lets a plugin do, in words an administrator deciding whether to install it can
 * weigh, rather than the name it has in a manifest.
 *
 * @param permission - The permission.
 * @returns A short title and a sentence of detail.
 */
const describePermission = (permission: Permission): { title: string; detail: string } => {
  switch (permission.kind) {
    case 'network':
      return {
        title: 'Talk to other websites',
        detail: `Only ${permission.hosts.join(', ')}, over HTTPS, and never to anything on your own network.`,
      };
    case 'library':
      return {
        title: 'Read your library',
        detail: 'See which titles, episodes and music are here. It cannot change or delete them.',
      };
    case 'viewing':
      return permission.access === 'write'
        ? {
            title: 'Change what people have watched',
            detail:
              'Read and change what somebody has watched and how far through they are, for people who use it.',
          }
        : {
            title: 'See what people have watched',
            detail: 'Read what somebody has watched, for people who use it.',
          };
    case 'requests':
      return {
        title: 'Ask for new titles',
        detail:
          'Make requests on somebody’s behalf, with only the request rights they already have.',
      };
    case 'playlists':
      return permission.access === 'write'
        ? {
            title: 'Make and change playlists',
            detail: 'Create playlists and add songs to them for people who use it.',
          }
        : { title: 'See playlists', detail: 'Read the playlists of people who use it.' };
    case 'storage':
      return {
        title: 'Keep its own notes',
        detail: `Store up to ${Math.ceil(permission.quotaBytes / 1_000_000).toString()} MB of its own data on this server.`,
      };
    case 'accounts':
      return {
        title: 'Connect to other accounts',
        detail: `Let people sign in to ${permission.providers.map((provider) => provider.name).join(' and ')}, so it can act for them there.`,
      };
    case 'notifications':
      return {
        title: 'Send notifications',
        detail: 'Tell people things in Valence’s own notifications.',
      };
    case 'emits':
      return {
        title: 'Tell your webhooks things',
        detail:
          'Send the events it lists to the webhooks you have subscribed to plugin events, such as an import finishing.',
      };
    case 'webhooks':
      return {
        title: 'Receive webhooks',
        detail:
          'Let outside services send it messages at private addresses of its own, which it acts on here.',
      };
  }
};

export { describePermission };
