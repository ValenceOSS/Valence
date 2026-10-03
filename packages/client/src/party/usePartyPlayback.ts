import { useMemo } from 'react';
import type { PartyPlayback } from '@ValenceClient/party/PartyPlayback';
import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';

/**
 * What a player needs to follow the watch party it is part of, from the party this client holds —
 * or nothing where that party is not watching anything, such as one listening to music, or there is
 * no party at all. It is the same object for as long as nothing in it changes, so a player that
 * keeps in step whenever it changes does so only when the room has moved.
 *
 * Nor is anything followed of a party watching something else: somebody in a party who moves on
 * to another episode is watching that alone, so the room's playing, pausing and moving cannot reach
 * a title it is not watching.
 *
 * @param watchParty - The party this client holds, where it holds one at all.
 * @param mediaId - What the player is playing.
 * @returns What the player follows, or nothing.
 */
const usePartyPlayback = (
  watchParty: WatchPartyState | undefined,
  mediaId: string | null,
): PartyPlayback | null => {
  const party =
    watchParty?.party?.kind === 'watch' && watchParty.party.mediaId === mediaId
      ? watchParty.party
      : null;
  const command = watchParty?.command ?? null;
  const meConnectionId = watchParty?.meConnectionId ?? null;
  const referenceSeconds = watchParty?.referenceSeconds ?? null;
  const jitterMs = watchParty?.jitterMs ?? 0;
  const waitingFor = watchParty?.waitingFor;
  const report = watchParty?.report;
  const send = watchParty?.send;

  return useMemo(
    () =>
      party === null || waitingFor === undefined || report === undefined || send === undefined
        ? null
        : {
            id: party.id,
            command,
            meConnectionId,
            referenceSeconds,
            jitterMs,
            isPlaying: party.isPlaying,
            isHeld: party.isHeld,
            waitingFor,
            members: party.members.length,
            onReport: report,
            onCommand: send,
          },
    [party, command, meConnectionId, referenceSeconds, jitterMs, waitingFor, report, send],
  );
};

export { usePartyPlayback };
