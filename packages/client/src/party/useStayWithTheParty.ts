import { useEffect, useRef } from 'react';
import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';

type StayWithTheParty = {
  watchParty: Pick<WatchPartyState, 'party' | 'leave'>;
  invitedTo: string | null;
  mediaId: string;
  onMovedTo: (mediaId: string) => void;
};

/**
 * Keeps a player with the watch party it is in, for a client that opens titles itself: when the
 * party moves on to another title, such as the next episode, this viewer is taken there with it,
 * and when this viewer moves on to a title the party is not watching, they leave it, since nobody
 * can watch two things with one room.
 *
 * Each is told apart by which side changed first. The party moving changes what it is watching
 * while this viewer is still on the old title; this viewer moving changes what they are watching
 * while the party is still on the old one. A party still being joined is left alone either way.
 *
 * @param stay - The party this client holds, the party being joined if any, what this viewer is
 *   watching, and what to do when the party moves on.
 */
const useStayWithTheParty = ({ watchParty, invitedTo, mediaId, onMovedTo }: StayWithTheParty) => {
  const partyMediaId = watchParty.party?.kind === 'watch' ? watchParty.party.mediaId : null;
  const seen = useRef<{ mediaId: string | null; partyMediaId: string | null }>({
    mediaId: null,
    partyMediaId,
  });
  const movedToRef = useRef(onMovedTo);
  const { leave } = watchParty;

  useEffect(() => {
    movedToRef.current = onMovedTo;
  });

  useEffect(() => {
    const before = seen.current;

    seen.current = { mediaId, partyMediaId };

    if (invitedTo !== null || partyMediaId === null || partyMediaId === mediaId) {
      return;
    }

    if (before.partyMediaId !== null && before.partyMediaId !== partyMediaId) {
      movedToRef.current(partyMediaId);

      return;
    }

    if (before.mediaId !== mediaId) {
      leave();
    }
  }, [invitedTo, mediaId, partyMediaId, leave]);
};

export type { StayWithTheParty };

export { useStayWithTheParty };
