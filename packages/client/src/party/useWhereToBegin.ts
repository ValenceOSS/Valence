import { useEffect, useRef, useState } from 'react';
import { whereToBegin, WAIT_FOR_THE_ROOM_MS } from '@ValenceClient/party/whereToBegin';
import type { Beginning } from '@ValenceClient/party/whereToBegin';
import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';

type Arriving = {
  watchParty: WatchPartyState;
  invitedTo: string | null;
  mediaId: string | null;
  resumeSeconds: number;
  isReady: boolean;
};

/**
 * Where a player opening a title should start, for somebody who may be arriving into a party
 * already watching it: the party they were invited to is joined once, the room is waited for a
 * moment, and once a start has been settled for a title, and for the invitation it came with, it
 * stays settled, so the room moving on
 * while the stream opens does not open it again.
 *
 * @param arriving - The party this client holds, the party they were invited to, the title, where
 *   this account had got to in it, and whether that is known yet.
 * @returns Where to begin, or that it is worth waiting a moment longer.
 */
const useWhereToBegin = ({
  watchParty,
  invitedTo,
  mediaId,
  resumeSeconds,
  isReady,
}: Arriving): Beginning => {
  const [hasWaitedForTheRoom, setHasWaitedForTheRoom] = useState(false);
  const [begun, setBegun] = useState<{
    mediaId: string;
    invitedTo: string | null;
    atSeconds: number;
  } | null>(null);
  const joinedRef = useRef<string | null>(null);
  const { join } = watchParty;

  useEffect(() => {
    if (invitedTo === null || joinedRef.current === invitedTo) {
      return;
    }

    joinedRef.current = invitedTo;
    join(invitedTo);
  }, [invitedTo, join]);

  useEffect(() => {
    if (invitedTo === null) {
      setHasWaitedForTheRoom(false);

      return;
    }

    const timer = setTimeout(() => {
      setHasWaitedForTheRoom(true);
    }, WAIT_FOR_THE_ROOM_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [invitedTo]);

  if (mediaId === null || !isReady) {
    return { kind: 'wait' };
  }

  if (begun !== null && begun.mediaId === mediaId && begun.invitedTo === invitedTo) {
    return { kind: 'begin', atSeconds: begun.atSeconds };
  }

  const joined = watchParty.party?.kind === 'watch' ? watchParty.party.id : null;
  const beginning = whereToBegin({
    invitedTo,
    joined,
    roomSeconds: watchParty.referenceSeconds,
    resumeSeconds,
    isBeingAsked: watchParty.passwordWanted !== null,
    hasWaitedLongEnough: hasWaitedForTheRoom,
  });

  if (beginning.kind === 'begin') {
    setBegun({ mediaId, invitedTo, atSeconds: beginning.atSeconds });
  }

  return beginning;
};

export type { Arriving };

export { useWhereToBegin };
