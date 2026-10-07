import type { Permission } from '@ValenceContracts/schemas/Permission';
import { say } from '@ValenceI18n/say';

type DefaultRole = {
  name: string;
  position: number;
  description: string;
  color: string;
  permissions: readonly Permission[];
};

const DEFAULT_ROLES: readonly DefaultRole[] = [
  {
    name: say('common.administrator'),
    position: 300,
    description: say('core.defaultRoles.runsTheServerEverythingIncludingAnything'),
    color: '#ED4245',
    permissions: ['administrator'],
  },
  {
    name: say('core.defaultRoles.manager'),
    position: 200,
    description: say('core.defaultRoles.looksAfterTheLibrariesAndWhat'),
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
    name: say('core.defaultRoles.member'),
    position: 100,
    description: say('core.defaultRoles.watchesSharesAndDownloadsWhatEverybody'),
    color: '#99AAB5',
    permissions: [
      'sharing.link',
      'sharing.party',
      'download.media',
      'requests.ask',
      'requests.askMusic',
      'requests.viewAll',
    ],
  },
  {
    name: say('core.defaultRoles.restricted'),
    position: 0,
    description: say('core.defaultRoles.watchesAndNothingElseForAn'),
    color: '#747F8D',
    permissions: [],
  },
];

const ADMINISTRATOR_ROLE_NAME = say('common.administrator');

const DEFAULT_ROLE_NAME = say('core.defaultRoles.member');

export { ADMINISTRATOR_ROLE_NAME, DEFAULT_ROLES, DEFAULT_ROLE_NAME };
