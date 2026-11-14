/* oxlint-disable valence/no-hard-coded-strings -- Jellyfin's own field values and kinds, which its apps match on and no person reads */
import { jellyfinIdOf } from '@ValenceServer/jellyfin/jellyfinIdOf';
import { syntheticJellyfinId } from '@ValenceServer/jellyfin/syntheticJellyfinId';
import type { JellyfinCaller } from '@ValenceServer/jellyfin/JellyfinBackend';
import type { JellyfinSession } from '@ValenceServer/jellyfin/JellyfinDtos';

const PLAYS = ['Video'];

/**
 * The signed-in app's own session, as Jellyfin describes one.
 *
 * @param caller - Who signed in, and from which app and device.
 * @param serverId - The server's identifier.
 * @returns The session.
 */
const jellyfinSessionOf = (caller: JellyfinCaller, serverId: string): JellyfinSession => {
  const { client, device, deviceId, version } = caller.origin.client;

  return {
    Id: syntheticJellyfinId('session', `${caller.profile.id}:${deviceId ?? ''}`),
    UserId: jellyfinIdOf(caller.profile.id),
    UserName: caller.profile.name,
    Client: client ?? '',
    DeviceId: deviceId ?? '',
    DeviceName: device ?? '',
    ApplicationVersion: version ?? '',
    IsActive: true,
    LastActivityDate: new Date().toISOString(),
    ServerId: serverId,
    SupportsMediaControl: false,
    SupportsRemoteControl: false,
    PlayableMediaTypes: PLAYS,
    AdditionalUsers: [],
    Capabilities: { PlayableMediaTypes: PLAYS, SupportedCommands: [] },
  };
};

export { jellyfinSessionOf };
