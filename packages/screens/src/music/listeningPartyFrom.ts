import { partyAllows, powersOf } from '@ValenceContracts/schemas/WatchParty';
import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';
import type { ListeningParty } from './listeningParty';

/**
 * The listening party this window is in, read out of whichever party it is in, with what it may do
 * there worked out once rather than by every control that asks.
 *
 * A watch party is not a listening party, so it answers nothing for one: the film player has that.
 *
 * @param watchParty - The party this window is in, whatever kind, and who this window is in it.
 * @returns The listening party, or nothing.
 */
const listeningPartyFrom = (
  watchParty: Pick<WatchPartyState, 'party' | 'meConnectionId' | 'send'>,
): ListeningParty | null => {
  const { party, meConnectionId, send } = watchParty;

  if (party?.kind !== 'listen') {
    return null;
  }

  const role =
    party.members.find((member) => member.connectionId === meConnectionId)?.role ?? 'guest';

  return {
    party,
    hostName: party.members.find((member) => member.role === 'host')?.name ?? 'the host',
    mayChoose: powersOf(role).includes('changeWhatIsPlaying'),
    mayPlayPause: partyAllows(party, role, { kind: 'play', atSeconds: 0 }),
    maySeek: partyAllows(party, role, { kind: 'seek', atSeconds: 0 }),
    send,
  };
};

export { listeningPartyFrom };
