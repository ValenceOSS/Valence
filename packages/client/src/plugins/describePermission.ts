import type { Permission } from '@ValenceSDK/manifest/PermissionSchema';
import { say } from '@ValenceI18n/say';

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
        title: say('client.plugins.describePermission.talkToOtherWebsites'),
        detail: say('client.plugins.describePermission.onlyValueOverHTTPSAndNever', {
          value: permission.hosts.join(', '),
        }),
      };
    case 'library':
      return {
        title: say('client.plugins.describePermission.readYourLibrary'),
        detail: say('client.plugins.describePermission.seeWhichTitlesEpisodesAndMusic'),
      };
    case 'viewing':
      return permission.access === 'write'
        ? {
            title: say('client.plugins.describePermission.changeWhatPeopleHaveWatched'),
            detail: say('client.plugins.describePermission.readAndChangeWhatSomebodyHas'),
          }
        : {
            title: say('client.plugins.describePermission.seeWhatPeopleHaveWatched'),
            detail: say('client.plugins.describePermission.readWhatSomebodyHasWatchedFor'),
          };
    case 'requests':
      return {
        title: say('client.plugins.describePermission.askForNewTitles'),
        detail: say('client.plugins.describePermission.makeRequestsOnSomebodysBehalfWith'),
      };
    case 'playlists':
      return permission.access === 'write'
        ? {
            title: say('client.plugins.describePermission.makeAndChangePlaylists'),
            detail: say('client.plugins.describePermission.createPlaylistsAndAddSongsTo'),
          }
        : {
            title: say('client.plugins.describePermission.seePlaylists'),
            detail: say('client.plugins.describePermission.readThePlaylistsOfPeopleWho'),
          };
    case 'storage':
      return {
        title: say('client.plugins.describePermission.keepItsOwnNotes'),
        detail: say('client.plugins.describePermission.storeUpToValueMBOf', {
          value: Math.ceil(permission.quotaBytes / 1_000_000).toString(),
        }),
      };
    case 'accounts':
      return {
        title: say('client.plugins.describePermission.connectToOtherAccounts'),
        detail: say('client.plugins.describePermission.letPeopleSignInToValue', {
          value: permission.providers.map((provider) => provider.name).join(' and '),
        }),
      };
    case 'notifications':
      return {
        title: say('client.plugins.describePermission.sendNotifications'),
        detail: say('client.plugins.describePermission.tellPeopleThingsInValencesOwn'),
      };
    case 'emits':
      return {
        title: say('client.plugins.describePermission.tellYourWebhooksThings'),
        detail: say('client.plugins.describePermission.sendTheEventsItListsTo'),
      };
    case 'webhooks':
      return {
        title: say('client.plugins.describePermission.receiveWebhooks'),
        detail: say('client.plugins.describePermission.letOutsideServicesSendItMessages'),
      };
  }
};

export { describePermission };
