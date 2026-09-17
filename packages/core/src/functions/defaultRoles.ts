import type { Permission } from '@ValenceContracts/schemas/Permission';

type DefaultRole = {
  name: string;
  position: number;
  description: string;
  color: string;
  permissions: readonly Permission[];
};

const DEFAULT_ROLES: readonly DefaultRole[] = [
  {
    name: 'Administrator',
    position: 300,
    description: 'Runs the server. Everything, including anything added later.',
    color: '#ED4245',
    permissions: ['administrator'],
  },
  {
    name: 'Manager',
    position: 200,
    description: 'Looks after the libraries and what is in them, but not the server itself.',
    color: '#5865F2',
    permissions: [
      'library.create',
      'library.edit',
      'jobs.run',
      'jobs.schedule',
      'media.rescan',
      'media.override',
      'media.artwork',
      'media.hide',
      'streaming.view',
      'streaming.stop',
      'streaming.pause',
      'streaming.message',
      'sharing.link',
      'sharing.party',
      'sharing.manage',
      'download.media',
      'account.keys',
      'server.logs',
      'server.monitor',
    ],
  },
  {
    name: 'Member',
    position: 100,
    description: 'Watches, shares and downloads. What everybody in the house gets.',
    color: '#99AAB5',
    permissions: ['sharing.link', 'sharing.party', 'download.media', 'account.keys'],
  },
  {
    name: 'Restricted',
    position: 0,
    description: 'Watches, and nothing else. For an account somebody wants kept narrow.',
    color: '#747F8D',
    permissions: [],
  },
];

const ADMINISTRATOR_ROLE_NAME = 'Administrator';

const DEFAULT_ROLE_NAME = 'Member';

export { ADMINISTRATOR_ROLE_NAME, DEFAULT_ROLES, DEFAULT_ROLE_NAME };
