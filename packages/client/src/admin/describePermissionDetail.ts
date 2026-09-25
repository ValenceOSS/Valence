import type { Permission } from '@ValenceContracts/schemas/Permission';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const DETAILS: Record<Permission, StringKey> = {
  administrator: 'client.describePermissionDetail.administrator',

  'library.create': 'client.describePermissionDetail.library.create',
  'library.edit': 'client.describePermissionDetail.library.edit',
  'library.delete': 'client.describePermissionDetail.library.delete',

  'jobs.run': 'client.describePermissionDetail.jobs.run',
  'jobs.schedule': 'client.describePermissionDetail.jobs.schedule',
  'jobs.runDestructive': 'client.describePermissionDetail.jobs.runDestructive',

  'media.rescan': 'client.describePermissionDetail.media.rescan',
  'media.delete': 'client.describePermissionDetail.media.delete',
  'media.reencode': 'client.describePermissionDetail.media.reencode',
  'media.override': 'client.describePermissionDetail.media.override',
  'media.artwork': 'client.describePermissionDetail.media.artwork',
  'media.hide': 'client.describePermissionDetail.media.hide',

  'sharing.link': 'client.describePermissionDetail.sharing.link',
  'sharing.party': 'client.describePermissionDetail.sharing.party',
  'sharing.manage': 'client.describePermissionDetail.sharing.manage',

  'streaming.view': 'client.describePermissionDetail.streaming.view',
  'streaming.stop': 'client.describePermissionDetail.streaming.stop',
  'streaming.pause': 'client.describePermissionDetail.streaming.pause',
  'streaming.message': 'client.describePermissionDetail.streaming.message',

  'download.media': 'client.describePermissionDetail.download.media',

  'requests.ask': 'client.describePermissionDetail.requests.ask',
  'requests.askMusic': 'client.describePermissionDetail.requests.askMusic',
  'requests.autoApprove': 'client.describePermissionDetail.requests.autoApprove',
  'requests.viewAll': 'client.describePermissionDetail.requests.viewAll',
  'requests.approve': 'client.describePermissionDetail.requests.approve',
  'requests.manage': 'client.describePermissionDetail.requests.manage',

  'account.invite': 'client.describePermissionDetail.account.invite',
  'account.manage': 'client.describePermissionDetail.account.manage',
  'account.ban': 'client.describePermissionDetail.account.ban',
  'account.roles': 'client.describePermissionDetail.account.roles',
  'account.profiles': 'client.describePermissionDetail.account.profiles',
  'account.security': 'client.describePermissionDetail.account.security',
  'account.keys': 'client.describePermissionDetail.account.keys',

  'server.settings': 'client.describePermissionDetail.server.settings',
  'server.backup': 'client.describePermissionDetail.server.backup',
  'server.logs': 'client.describePermissionDetail.server.logs',
  'server.monitor': 'client.describePermissionDetail.server.monitor',
  'server.webhooks': 'client.describePermissionDetail.server.webhooks',
};

/**
 * Says what a permission actually lets somebody do, in a sentence rather than the phrase
 * {@link describePermission} gives — for the moment somebody is deciding whether to grant it, not
 * skimming a list of what a role already holds.
 *
 * @param permission The permission as the server names it.
 */
const describePermissionDetail = (permission: Permission): string => say(DETAILS[permission]);

export { describePermissionDetail };
