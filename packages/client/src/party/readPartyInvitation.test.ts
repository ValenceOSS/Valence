import { describe, expect, it } from 'vitest';
import { readPartyInvitation } from './readPartyInvitation';

describe('readPartyInvitation', () => {
  it('reads an invitation to watch something together', () => {
    expect(readPartyInvitation('/watch/film-1?party=p-1')).toEqual({
      kind: 'watch',
      mediaId: 'film-1',
      partyId: 'p-1',
    });
  });

  it('reads an invitation to listen along', () => {
    expect(readPartyInvitation('/music?party=p-2')).toEqual({ kind: 'listen', partyId: 'p-2' });
  });

  it('finds the party among other parts of the address', () => {
    expect(readPartyInvitation('/watch/film-1?from=bell&party=p-3')).toMatchObject({
      partyId: 'p-3',
    });
  });

  it('reads nothing from a link that is no invitation', () => {
    expect(readPartyInvitation('/?item=film-1')).toBeNull();
    expect(readPartyInvitation('/watch/film-1')).toBeNull();
    expect(readPartyInvitation(null)).toBeNull();
  });

  it('reads a badly escaped link as no invitation rather than failing', () => {
    expect(readPartyInvitation('/watch/film-1?party=%E0%A4')).toBeNull();
  });
});
