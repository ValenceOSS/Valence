import type { Permission } from '@ValenceContracts/schemas/Permission';
import { say } from '@ValenceI18n/say';

const LABELS: Record<Permission, string> = {
  administrator: say('client.admin.describePermission.everythingIncludingAnythingAddedLater'),

  'library.create': say('common.addALibrary'),
  'library.edit': say('client.admin.describePermission.changeALibrarysSettings'),
  'library.delete': say('client.admin.describePermission.deleteALibrary'),

  'jobs.run': say('client.admin.describePermission.runAJob'),
  'jobs.schedule': say('client.admin.describePermission.changeWhenJobsRun'),
  'jobs.runDestructive': say('client.admin.describePermission.runResetAndRebuild'),

  'media.rescan': say('client.admin.describePermission.rescanOneItem'),
  'media.delete': say('client.admin.describePermission.deleteMediaFromDisk'),
  'media.reencode': say('common.reEncodeMedia'),
  'media.override': say('client.admin.describePermission.correctMetadata'),
  'media.artwork': say('client.admin.describePermission.changeArtwork'),
  'media.hide': say('client.admin.describePermission.hideAnItemFromEverybody'),

  'sharing.link': say('client.admin.describePermission.createShareLinks'),
  'sharing.party': say('client.admin.describePermission.startWatchParties'),
  'sharing.manage': say('client.admin.describePermission.seeAndWithdrawAnybodysShareLinks'),

  'streaming.view': say('client.admin.describePermission.seeWhoIsWatching'),
  'streaming.stop': say('client.admin.describePermission.stopSomebodysStream'),
  'streaming.pause': say('client.admin.describePermission.pauseSomebodysStream'),
  'streaming.message': say('client.admin.describePermission.sendSomebodyAMessage'),

  'download.media': say('client.admin.describePermission.downloadMedia'),

  'requests.ask': say('client.admin.describePermission.requestFilmsAndSeries'),
  'requests.askMusic': say('client.admin.describePermission.requestMusic'),
  'requests.autoApprove': say('client.admin.describePermission.haveRequestsGoStraightThrough'),
  'requests.viewAll': say('client.admin.describePermission.seeEverybodysRequests'),
  'requests.approve': say('client.admin.describePermission.approveOrTurnDownRequests'),
  'requests.manage': say('client.admin.describePermission.setUpIndexersDownloadClientsAnd'),

  'account.invite': say('client.admin.describePermission.inviteSomebody'),
  'account.manage': say('client.admin.describePermission.manageAccounts'),
  'account.ban': say('client.admin.describePermission.banAnAccount'),
  'account.roles': say('client.admin.describePermission.manageRoles'),
  'account.profiles': say('client.admin.describePermission.manageOtherPeoplesProfiles'),
  'account.security': say('client.admin.describePermission.resetPasswordsAndSignAccountsOut'),

  'server.settings': say('client.admin.describePermission.changeServerSettings'),
  'server.backup': say('client.admin.describePermission.backTheServerUp'),
  'server.logs': say('client.admin.describePermission.readTheLogs'),
  'account.keys': say('client.admin.describePermission.holdAPIKeysForUseOutside'),
  'server.monitor': say('client.admin.describePermission.seeWhatTheServerIsDoing'),
  'server.webhooks': say('client.admin.describePermission.haveTheServerCallOutWhen'),
  'server.plugins': say('client.admin.describePermission.installAndManagePlugins'),
  'server.links': say('client.admin.describePermission.linkThisServerWithOthers'),
};

/**
 * Names a permission in words rather than in the identifier it is stored as, so that a role editor
 * reads as sentences about what somebody may do.
 *
 * @param permission The permission as the server names it.
 */
const describePermission = (permission: Permission): string => LABELS[permission];

export { describePermission };
