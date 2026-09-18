import { describe, expect, it, vi } from 'vitest';
import { listeningPartyFrom } from './listeningPartyFrom';
import type { PartyMember, WatchParty } from '@ValenceContracts/schemas/WatchParty';

const member = (connectionId: string, name: string, role: PartyMember['role']): PartyMember => ({
  connectionId,
  accountId: `account-${connectionId}`,
  profileId: null,
  name,
  role,
  joinedAtMs: 0,
  isWatching: true,
  isReady: true,
  positionSeconds: 0,
  reportedAtMs: 0,
  bufferedAheadSeconds: 0,
});

const PARTY: WatchParty = {
  id: 'p1',
  kind: 'listen',
  mediaId: 'song',
  createdAtMs: 0,
  everyoneMaySeek: false,
  everyoneMayPlayPause: false,
  hasPassword: false,
  isPlaying: true,
  isHeld: false,
  members: [member('dan', 'Dan', 'host'), member('sam', 'Sam', 'guest')],
  timekeeperId: 'dan',
};

describe('listeningPartyFrom', () => {
  it('answers nothing outside a party', () => {
    expect(listeningPartyFrom({ party: null, meConnectionId: 'sam', send: vi.fn() })).toBeNull();
  });

  it('answers nothing for a party that is watching a film', () => {
    expect(
      listeningPartyFrom({
        party: { ...PARTY, kind: 'watch' },
        meConnectionId: 'sam',
        send: vi.fn(),
      }),
    ).toBeNull();
  });

  it('lets the host choose the song and where it is', () => {
    const party = listeningPartyFrom({ party: PARTY, meConnectionId: 'dan', send: vi.fn() });

    expect(party).toMatchObject({ mayChoose: true, mayPlayPause: true, maySeek: true });
  });

  it('leaves a guest listening along, and names who they are listening with', () => {
    const party = listeningPartyFrom({ party: PARTY, meConnectionId: 'sam', send: vi.fn() });

    expect(party).toMatchObject({
      hostName: 'Dan',
      mayChoose: false,
      mayPlayPause: false,
      maySeek: false,
    });
  });

  it('lets a guest pause where the host has loosened the party', () => {
    const party = listeningPartyFrom({
      party: { ...PARTY, everyoneMayPlayPause: true },
      meConnectionId: 'sam',
      send: vi.fn(),
    });

    expect(party?.mayPlayPause).toBe(true);
    expect(party?.maySeek).toBe(false);
  });
});
