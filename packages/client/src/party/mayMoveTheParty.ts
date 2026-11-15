import { partyAllows } from '@ValenceContracts/schemas/WatchParty';
import type { WatchParty } from '@ValenceContracts/schemas/WatchParty';

/**
 * Whether this viewer may move a watch party on to another title, such as the next episode, by the
 * same rule the server holds them to.
 *
 * @param party - The party they are in, or nothing.
 * @param meConnectionId - Which member of it they are, once the server has said.
 * @returns Whether they may.
 */
const mayMoveTheParty = (party: WatchParty | null, meConnectionId: string | null): boolean => {
  if (party === null || party.kind !== 'watch') {
    return false;
  }

  const role =
    party.members.find((member) => member.connectionId === meConnectionId)?.role ?? 'guest';

  return partyAllows(party, role, { kind: 'changeWhatIsPlaying', mediaId: party.mediaId });
};

export { mayMoveTheParty };
