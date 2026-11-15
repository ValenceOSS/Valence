import type { WatchParty } from '@ValenceContracts/schemas/WatchParty';

type Taken = { mediaId: string; partyId: string; isFromTheStart: boolean };

/**
 * Where a watch party takes somebody in it who is not watching what it is: into it, on arriving,
 * where the room has got to, or on to the title it has moved to, from the start of that title, since
 * a party moving on starts everybody at the beginning together.
 *
 * @param party - The party this viewer is in, or nothing.
 * @param place - What this viewer is watching, and the party they are watching it in, if any.
 * @returns Where to take them, or nothing where they are already there or there is no watch party.
 */
const whereThePartyTakes = (
  party: WatchParty | null,
  place: { playing: string | null; party: string | null },
): Taken | null => {
  if (party === null || party.kind !== 'watch') {
    return null;
  }

  if (place.party === party.id && place.playing === party.mediaId) {
    return null;
  }

  return {
    mediaId: party.mediaId,
    partyId: party.id,
    isFromTheStart: place.party === party.id,
  };
};

export type { Taken };

export { whereThePartyTakes };
