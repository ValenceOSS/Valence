import type { PartyMember } from '@ValenceContracts/schemas/WatchParty';

/**
 * Somebody in a party, watching and caught up, for a test to change what it needs.
 *
 * @param change - What differs.
 * @returns The member.
 */
const aPartyMember = (change: Partial<PartyMember> = {}): PartyMember => ({
  connectionId: 'me',
  accountId: 'account-1',
  profileId: null,
  name: 'Sam',
  role: 'host',
  joinedAtMs: 0,
  isWatching: true,
  isReady: true,
  positionSeconds: 0,
  reportedAtMs: 0,
  bufferedAheadSeconds: 10,
  ...change,
});

export { aPartyMember };
