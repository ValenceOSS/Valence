import type { Permission } from '@ValenceContracts/schemas/Permission';
import { say } from '@ValenceI18n/say';

const DETAILS: Record<Permission, string> = {
  administrator: say('client.admin.describePermissionDetail.grantsEveryPermissionThereIsIncluding'),

  'library.create': say('client.admin.describePermissionDetail.pointValenceAtANewFolder'),
  'library.edit': say('client.admin.describePermissionDetail.changeALibrarysSettingsItsName'),
  'library.delete': say('client.admin.describePermissionDetail.removeALibraryAndForgetEverything'),

  'jobs.run': say('client.admin.describePermissionDetail.startAJobSuchAsA'),
  'jobs.schedule': say('client.admin.describePermissionDetail.changeWhenARecurringJobRuns'),
  'jobs.runDestructive': say('client.admin.describePermissionDetail.runAResetOrAFull'),

  'media.rescan': say('client.admin.describePermissionDetail.askValenceToReadOneItem'),
  'media.delete': say('client.admin.describePermissionDetail.deleteAMediaFileFromDisk'),
  'media.reencode': say('client.admin.describePermissionDetail.reEncodeMediaAtAChosen'),
  'media.override': say('client.admin.describePermissionDetail.correctAnItemsMetadataByHand'),
  'media.artwork': say('client.admin.describePermissionDetail.replaceAnItemsPosterOrBackdrop'),
  'media.hide': say('client.admin.describePermissionDetail.hideAnItemFromEveryProfile'),

  'sharing.link': say('client.admin.describePermissionDetail.createALinkThatLetsSomebody'),
  'sharing.party': say('client.admin.describePermissionDetail.startAWatchPartyPlayingOne'),
  'sharing.manage': say('client.admin.describePermissionDetail.seeEveryShareLinkAnybodyHas'),

  'streaming.view': say('client.admin.describePermissionDetail.seeWhoIsWatchingRightNow'),
  'streaming.stop': say('client.admin.describePermissionDetail.endSomebodyElsesStream'),
  'streaming.pause': say('client.admin.describePermissionDetail.pauseSomebodyElsesStreamFromWhere'),
  'streaming.message': say('client.admin.describePermissionDetail.sendAMessageThatAppearsOver'),

  'download.media': say('client.admin.describePermissionDetail.saveACopyOfMediaTo'),

  'requests.ask': say('client.admin.describePermissionDetail.askForAFilmOrSeries'),
  'requests.askMusic': say('client.admin.describePermissionDetail.askForAnArtistOrAlbum'),
  'requests.autoApprove': say('client.admin.describePermissionDetail.haveWhatTheyAskForSearched'),
  'requests.viewAll': say('client.admin.describePermissionDetail.seeWhatEverybodyHasAskedFor'),
  'requests.approve': say('client.admin.describePermissionDetail.approveOrTurnDownWhatOther'),
  'requests.manage': say('client.admin.describePermissionDetail.setUpTheIndexersDownloadClients'),

  'account.invite': say('client.admin.describePermissionDetail.inviteSomebodyNewToSignIn'),
  'account.manage': say('client.admin.describePermissionDetail.renameSuspendOrRemoveAnExisting'),
  'account.ban': say('client.admin.describePermissionDetail.banAnAccountEndingItsSessions'),
  'account.roles': say(
    'client.admin.describePermissionDetail.createRolesAndChooseWhichPermissions',
  ),
  'account.profiles': say('client.admin.describePermissionDetail.addRenameOrRemoveAnotherAccounts'),
  'account.security': say(
    'client.admin.describePermissionDetail.resetAnotherAccountsPasswordSignIt',
  ),
  'account.keys': say('client.admin.describePermissionDetail.holdAnAPIKeyForReaching'),

  'server.settings': say('client.admin.describePermissionDetail.changeServerWideSettingsSuchAs'),
  'server.backup': say('client.admin.describePermissionDetail.startABackupOfTheServer'),
  'server.logs': say('client.admin.describePermissionDetail.readTheServersLogIncludingEntries'),
  'server.monitor': say('client.admin.describePermissionDetail.seeWhatTheServerIsDoing'),
  'server.webhooks': say('client.admin.describePermissionDetail.haveTheServerCallOutTo'),
  'server.plugins': say('client.admin.describePermissionDetail.installPluginsFromTheCatalogueOr'),
  'server.links': say('client.admin.describePermissionDetail.linkThisServerWithOthers'),
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
