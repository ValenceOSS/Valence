import type { Permission } from '@ValenceContracts/schemas/Permission';
import { say } from '@ValenceI18n/say';

const DETAILS: Record<Permission, string> = {
  administrator: say('client.admin.describePermissionDetail.everyPermissionIncludingOnesAddedIn'),
  'library.edit': say('client.admin.describePermissionDetail.addLibrariesAndChangeTheirSettings'),
  'library.delete': say('client.admin.describePermissionDetail.deleteALibraryAndEverythingScanned'),
  'jobs.run': say('client.admin.describePermissionDetail.startJobsSuchAsScansBy'),
  'jobs.runDestructive': say('client.admin.describePermissionDetail.runAResetOrAFull'),
  'media.override': say('client.admin.describePermissionDetail.fixWrongMatchesEditMetadataChoose'),
  'media.delete': say('client.admin.describePermissionDetail.deleteMediaFilesFromDiskNot'),
  'media.reencode': say('client.admin.describePermissionDetail.reEncodeMediaAtAChosenQuality'),
  'media.subtitles': say(
    'client.admin.describePermissionDetail.searchForAndDownloadSubtitlesWhile',
  ),
  'sharing.link': say('client.admin.describePermissionDetail.letSomeoneOutsideTheServerWatch'),
  'sharing.party': say('client.admin.describePermissionDetail.playOneStreamToEveryoneWho'),
  'sharing.manage': say('client.admin.describePermissionDetail.seeAndRevokeAnyonesShareLinks'),
  'streaming.view': say('client.admin.describePermissionDetail.seeWhoIsWatchingRightNow'),
  'streaming.control': say('client.admin.describePermissionDetail.pauseOrStopSomeoneElsesStream'),
  'download.media': say('client.admin.describePermissionDetail.saveACopyOfMediaTo'),
  'requests.ask': say('client.admin.describePermissionDetail.askForAFilmOrSeries'),
  'requests.askMusic': say('client.admin.describePermissionDetail.askForAnArtistOrAlbum'),
  'requests.autoApprove': say(
    'client.admin.describePermissionDetail.theirRequestsDownloadStraightAwayWithout',
  ),
  'requests.viewAll': say('client.admin.describePermissionDetail.seeEveryonesRequestsAndHowEach'),
  'requests.approve': say('client.admin.describePermissionDetail.approveOrTurnDownWhatOther'),
  'requests.manage': say('client.admin.describePermissionDetail.setUpIndexersDownloadClientsAnd'),
  'sources.play': say('client.admin.describePermissionDetail.playAFilmStraightAwayFromAPlugin'),
  'account.keys': say('client.admin.describePermissionDetail.createAPIKeysForScriptsAnd'),
  'account.invite': say('client.admin.describePermissionDetail.inviteSomeoneNewToMakeAn'),
  'account.manage': say('client.admin.describePermissionDetail.renameSuspendBanOrRemoveAccounts'),
  'account.roles': say(
    'client.admin.describePermissionDetail.createRolesAndChooseWhichPermissions',
  ),
  'server.settings': say(
    'client.admin.describePermissionDetail.changeServerWideSettingsSuchAsHardware',
  ),
  'server.backup': say('client.admin.describePermissionDetail.startABackupOfTheServer'),
  'server.monitor': say('client.admin.describePermissionDetail.seeCPUMemoryAndTranscodesAnd'),
  'server.plugins': say('client.admin.describePermissionDetail.installSetUpAndRemovePlugins'),
  'server.links': say('client.admin.describePermissionDetail.linkThisServerWithOtherValence'),
};

/**
 * Says what a permission actually lets somebody do, in a sentence rather than the phrase
 * {@link describePermission} gives — for the moment somebody is deciding whether to grant it, not
 * skimming a list of what a role already holds.
 *
 * @param permission The permission as the server names it.
 */
const describePermissionDetail = (permission: Permission): string => DETAILS[permission];

export { describePermissionDetail };
