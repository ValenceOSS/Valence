/* oxlint-disable valence/no-hard-coded-strings -- Jellyfin's own field values and kinds, which its apps match on and no person reads */
import { jellyfinIdOf } from '@ValenceServer/jellyfin/jellyfinIdOf';
import type { JellyfinUser } from '@ValenceServer/jellyfin/JellyfinDtos';
import type { JellyfinCaller } from '@ValenceServer/jellyfin/JellyfinBackend';

/**
 * The profile a Jellyfin app signed in as, described as a Jellyfin user. Each profile is a user of
 * its own; what it may do is Valence's to decide, so it claims no more than playing what it is
 * shown, and never Jellyfin's administration.
 *
 * @param caller - Who signed in.
 * @param serverId - The server's identifier.
 * @returns The user.
 */
const jellyfinUserOf = (
  caller: Pick<JellyfinCaller, 'profile'>,
  serverId: string,
): JellyfinUser => {
  const id = jellyfinIdOf(caller.profile.id);

  return {
    Name: caller.profile.name,
    ServerId: serverId,
    Id: id,
    PrimaryImageTag: id,
    HasPassword: true,
    HasConfiguredPassword: true,
    HasConfiguredEasyPassword: false,
    EnableAutoLogin: false,
    Configuration: {
      PlayDefaultAudioTrack: true,
      SubtitleLanguagePreference: '',
      DisplayMissingEpisodes: false,
      GroupedFolders: [],
      SubtitleMode: 'Default',
      DisplayCollectionsView: false,
      EnableLocalPassword: false,
      OrderedViews: [],
      LatestItemsExcludes: [],
      MyMediaExcludes: [],
      HidePlayedInLatest: true,
      RememberAudioSelections: true,
      RememberSubtitleSelections: true,
      EnableNextEpisodeAutoPlay: true,
    },
    Policy: {
      IsAdministrator: false,
      IsHidden: true,
      IsDisabled: false,
      EnableUserPreferenceAccess: false,
      EnableRemoteControlOfOtherUsers: false,
      EnableSharedDeviceControl: false,
      EnableRemoteAccess: true,
      EnableLiveTvManagement: false,
      EnableLiveTvAccess: false,
      EnableMediaPlayback: true,
      EnableAudioPlaybackTranscoding: true,
      EnableVideoPlaybackTranscoding: true,
      EnablePlaybackRemuxing: true,
      EnableContentDeletion: false,
      EnableContentDownloading: true,
      EnableSyncTranscoding: false,
      EnableMediaConversion: false,
      EnableAllDevices: true,
      EnableAllChannels: false,
      EnableAllFolders: true,
      EnablePublicSharing: false,
      AuthenticationProviderId: 'Valence',
      PasswordResetProviderId: 'Valence',
      SyncPlayAccess: 'None',
    },
  };
};

export { jellyfinUserOf };
