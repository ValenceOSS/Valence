import { describe, expect, it } from 'vitest';
import { whereThePartyTakes } from '@ValenceClient/party/whereThePartyTakes';
import { aWatchParty } from '@ValenceClient/testing/aWatchParty';

describe('whereThePartyTakes', () => {
  it('takes somebody arriving into what the party is watching, where the room has got to', () => {
    expect(
      whereThePartyTakes(aWatchParty({ id: 'p-1', mediaId: 'film-1' }), {
        playing: null,
        party: null,
      }),
    ).toEqual({ mediaId: 'film-1', partyId: 'p-1', isFromTheStart: false });
  });

  it('takes somebody in the party on to the title it has moved to, from the start', () => {
    expect(
      whereThePartyTakes(aWatchParty({ id: 'p-1', mediaId: 'episode-2' }), {
        playing: 'episode-1',
        party: 'p-1',
      }),
    ).toEqual({ mediaId: 'episode-2', partyId: 'p-1', isFromTheStart: true });
  });

  it('leaves somebody already watching what the party is', () => {
    expect(
      whereThePartyTakes(aWatchParty({ id: 'p-1', mediaId: 'film-1' }), {
        playing: 'film-1',
        party: 'p-1',
      }),
    ).toBeNull();
  });

  it('takes nobody anywhere outside a watch party', () => {
    expect(whereThePartyTakes(null, { playing: null, party: null })).toBeNull();
    expect(
      whereThePartyTakes(aWatchParty({ kind: 'listen' }), { playing: null, party: null }),
    ).toBeNull();
  });
});
