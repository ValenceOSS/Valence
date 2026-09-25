import type { Permission } from '@ValenceContracts/schemas/Permission';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const LABELS: Record<Permission, StringKey> = {
  administrator: 'client.describePermission.administrator',

  'library.create': 'client.describePermission.library.create',
  'library.edit': 'client.describePermission.library.edit',
  'library.delete': 'client.describePermission.library.delete',

  'jobs.run': 'client.describePermission.jobs.run',
  'jobs.schedule': 'client.describePermission.jobs.schedule',
  'jobs.runDestructive': 'client.describePermission.jobs.runDestructive',

  'media.rescan': 'client.describePermission.media.rescan',
  'media.delete': 'client.describePermission.media.delete',
  'media.reencode': 'client.describePermission.media.reencode',
  'media.override': 'client.describePermission.media.override',
  'media.artwork': 'client.describePermission.media.artwork',
  'media.hide': 'client.describePermission.media.hide',

  'sharing.link': 'client.describePermission.sharing.link',
  'sharing.party': 'client.describePermission.sharing.party',
  'sharing.manage': 'client.describePermission.sharing.manage',

  'streaming.view': 'client.describePermission.streaming.view',
  'streaming.stop': 'client.describePermission.streaming.stop',
  'streaming.pause': 'client.describePermission.streaming.pause',
  'streaming.message': 'client.describePermission.streaming.message',

  'download.media': 'client.describePermission.download.media',

  'requests.ask': 'client.describePermission.requests.ask',
  'requests.askMusic': 'client.describePermission.requests.askMusic',
  'requests.autoApprove': 'client.describePermission.requests.autoApprove',
  'requests.viewAll': 'client.describePermission.requests.viewAll',
  'requests.approve': 'client.describePermission.requests.approve',
  'requests.manage': 'client.describePermission.requests.manage',

  'account.invite': 'client.describePermission.account.invite',
  'account.manage': 'client.describePermission.account.manage',
  'account.ban': 'client.describePermission.account.ban',
  'account.roles': 'client.describePermission.account.roles',
  'account.profiles': 'client.describePermission.account.profiles',
  'account.security': 'client.describePermission.account.security',

  'server.settings': 'client.describePermission.server.settings',
  'server.backup': 'client.describePermission.server.backup',
  'server.logs': 'client.describePermission.server.logs',
  'account.keys': 'client.describePermission.account.keys',
  'server.monitor': 'client.describePermission.server.monitor',
  'server.webhooks': 'client.describePermission.server.webhooks',
};

/**
 * Names a permission in words rather than in the identifier it is stored as, so that a role editor
 * reads as sentences about what somebody may do.
 *
 * @param permission The permission as the server names it.
 */
const describePermission = (permission: Permission): string => say(LABELS[permission]);

export { describePermission };
