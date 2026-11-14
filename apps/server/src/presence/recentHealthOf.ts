import type {
  PresencePlaybackHealth,
  PresenceService,
} from '@ValenceServer/presence/PresenceService';

const RECENT_FOR_MS = 5000;

/**
 * What a device's player last said of where it has got and how the stream is going, where it said
 * so in the last few seconds, so a player that has gone quiet is not passed on as if it were still
 * there.
 *
 * @param presence - Who is watching what.
 * @param clientId - The device.
 * @returns What it said, or nothing where it has said nothing lately.
 */
const recentHealthOf = (
  presence: Pick<PresenceService, 'list' | 'healthAgeOf'>,
  clientId: string,
): PresencePlaybackHealth | undefined => {
  const age = presence.healthAgeOf(clientId);
  const health = presence.list().find((entry) => entry.clientId === clientId)?.playback?.health;

  return age === null || age > RECENT_FOR_MS || health === null ? undefined : health;
};

export { recentHealthOf };
