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
    // eslint-disable-next-line valence/no-hard-coded-strings -- seeded once into the database, where an administrator edits it and the server finds the role by it
    name: 'Administrator',
    position: 300,
    // eslint-disable-next-line valence/no-hard-coded-strings -- seeded once into the database, where an administrator edits it and the server finds the role by it
    description: 'Runs the server. Everything, including anything added later.',
    color: '#ED4245',
    permissions: ['administrator'],
  },
  {
    // eslint-disable-next-line valence/no-hard-coded-strings -- seeded once into the database, where an administrator edits it and the server finds the role by it
    name: 'Manager',
    position: 200,
    // eslint-disable-next-line valence/no-hard-coded-strings -- seeded once into the database, where an administrator edits it and the server finds the role by it
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
      'requests.ask',
      'requests.askMusic',
      'requests.autoApprove',
      'requests.viewAll',
      'requests.approve',
      'account.keys',
      'server.logs',
      'server.monitor',
    ],
  },
  {
    // eslint-disable-next-line valence/no-hard-coded-strings -- seeded once into the database, where an administrator edits it and the server finds the role by it
    name: 'Member',
    position: 100,
    // eslint-disable-next-line valence/no-hard-coded-strings -- seeded once into the database, where an administrator edits it and the server finds the role by it
    description: 'Watches, shares and downloads. What everybody in the house gets.',
    color: '#99AAB5',
    permissions: [
      'sharing.link',
      'sharing.party',
      'download.media',
      'requests.ask',
      'requests.askMusic',
    ],
  },
  {
    // eslint-disable-next-line valence/no-hard-coded-strings -- seeded once into the database, where an administrator edits it and the server finds the role by it
    name: 'Restricted',
    position: 0,
    // eslint-disable-next-line valence/no-hard-coded-strings -- seeded once into the database, where an administrator edits it and the server finds the role by it
    description: 'Watches, and nothing else. For an account somebody wants kept narrow.',
    color: '#747F8D',
    permissions: [],
  },
];

// eslint-disable-next-line valence/no-hard-coded-strings -- seeded once into the database, where an administrator edits it and the server finds the role by it
const ADMINISTRATOR_ROLE_NAME = 'Administrator';

// eslint-disable-next-line valence/no-hard-coded-strings -- seeded once into the database, where an administrator edits it and the server finds the role by it
const DEFAULT_ROLE_NAME = 'Member';

export { ADMINISTRATOR_ROLE_NAME, DEFAULT_ROLES, DEFAULT_ROLE_NAME };
