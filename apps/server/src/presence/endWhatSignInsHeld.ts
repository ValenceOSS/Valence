import type { EndedSignIns } from '@ValenceServer/realtime/createSignedInSockets';
import type { PresenceService } from '@ValenceServer/presence/PresenceService';
import { stopPlayingOn } from '@ValenceServer/presence/stopPlayingOn';

type Holders = Parameters<typeof stopPlayingOn>[0] & {
  presence: PresenceService;
  closeSockets?: ((ended: EndedSignIns) => void) | undefined;
};

/**
 * Ends what ended sign-ins still had open: stops whatever each of their tabs is playing, tells each
 * tab why, and closes their sockets, so a device signed out stops hearing what its account is told
 * and goes back to the way in.
 *
 * @param holders - What plays, who has the app open and the sockets they hold.
 * @param ended - The sign-ins that were ended, or every sign-in of an account.
 * @param reason - Why, as the tabs are told it.
 */
const endWhatSignInsHeld = async (
  holders: Holders,
  ended: EndedSignIns,
  reason: string,
): Promise<void> => {
  const sessionIds = 'sessionIds' in ended ? new Set(ended.sessionIds) : null;
  const open = holders.presence
    .list()
    .filter((entry) =>
      sessionIds === null
        ? 'accountId' in ended && entry.accountId === ended.accountId
        : entry.sessionId !== null && sessionIds.has(entry.sessionId),
    );

  for (const entry of open) {
    await stopPlayingOn(holders, entry.clientId, entry.playback?.transcoderSessionId ?? null);
    holders.presence.stop(entry.clientId, reason);
  }

  holders.closeSockets?.(ended);
};

export { endWhatSignInsHeld };
