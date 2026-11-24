import type { Permission } from '@ValenceContracts/schemas/Permission';
import { say } from '@ValenceI18n/say';

const LABELS: Record<Permission, string> = {
  administrator: say('common.everything'),
  'library.edit': say('client.admin.describePermission.manageLibraries'),
  'library.delete': say('client.admin.describePermission.deleteLibraries'),
  'jobs.run': say('client.admin.describePermission.runAndScheduleJobs'),
  'jobs.runDestructive': say('common.resetAndRebuild'),
  'media.override': say('client.admin.describePermission.editTitles'),
  'media.delete': say('client.admin.describePermission.deleteFiles'),
  'media.reencode': say('common.reEncodeMedia'),
  'media.subtitles': say('screens.findSubtitlesDialog.findSubtitles'),
  'sharing.link': say('client.admin.describePermission.createShareLinks'),
  'sharing.party': say('client.admin.describePermission.startWatchParties'),
  'sharing.manage': say('client.admin.describePermission.manageShareLinks'),
  'streaming.view': say('client.admin.describePermission.seeWhoIsWatching'),
  'streaming.control': say('client.admin.describePermission.controlOtherPeoplesStreams'),
  'download.media': say('client.admin.describePermission.downloadMedia'),
  'requests.ask': say('client.admin.describePermission.requestFilmsAndSeries'),
  'requests.askMusic': say('client.admin.describePermission.requestMusic'),
  'requests.autoApprove': say('client.admin.describePermission.skipApproval'),
  'requests.viewAll': say('client.admin.describePermission.seeEveryonesRequests'),
  'requests.approve': say('client.admin.describePermission.approveRequests'),
  'requests.manage': say('client.admin.describePermission.setUpRequests'),
  'sources.play': say('client.admin.describePermission.watchFilmsNotOnTheServer'),
  'account.keys': say('client.admin.describePermission.holdAPIKeysForUseOutside'),
  'account.invite': say('common.partyPanel.askAlong'),
  'account.manage': say('client.admin.describePermission.manageAccounts'),
  'account.roles': say('client.admin.describePermission.manageRoles'),
  'server.settings': say('client.admin.describePermission.changeServerSettings'),
  'server.backup': say('client.admin.describePermission.backUpAndRestore'),
  'server.monitor': say('client.admin.describePermission.seeServerStatusAndLogs'),
  'server.plugins': say('client.admin.describePermission.managePlugins'),
  'server.links': say('client.admin.describePermission.linkServers'),
};

/**
 * Names a permission in words rather than in the identifier it is stored as, so that a role editor
 * reads as sentences about what somebody may do.
 *
 * @param permission The permission as the server names it.
 */
const describePermission = (permission: Permission): string => LABELS[permission];

export { describePermission };
