import type { FederationOutcome, LinkSharing } from '@ValenceContracts/schemas/LinkSharing';
import type { PeerItem } from './PeerItem';

/**
 * Whether a linked server may reach one of this server's titles: it has to be in a library shared
 * with that server, and within the age that server was given. Something nobody certificated is
 * refused under an age unless unrated things were allowed, as it is for an account here; a song or a
 * book is never read as unrated, since nothing certificates either.
 *
 * @param sharing - What is shared with the server asking.
 * @param item - The title.
 * @returns Whether it may, or why not.
 */
const peerMayReach = (
  sharing: LinkSharing,
  item: PeerItem,
): Extract<FederationOutcome, 'allowed' | 'notShared' | 'aboveTheAge'> => {
  if (!sharing.libraryIds.includes(item.libraryId)) {
    return 'notShared';
  }

  if (sharing.maximumAge === null || item.isNeverRated) {
    return 'allowed';
  }

  if (item.certificationAge === null) {
    return sharing.allowsUnrated ? 'allowed' : 'aboveTheAge';
  }

  return item.certificationAge <= sharing.maximumAge ? 'allowed' : 'aboveTheAge';
};

export { peerMayReach };
