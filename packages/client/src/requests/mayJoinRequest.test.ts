import { describe, expect, it } from 'vitest';
import { mayJoinRequest } from './mayJoinRequest';
import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';

const REQUESTED: CatalogueStanding = {
  status: 'requested',
  mediaId: null,
  requestId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  requestState: 'wanted',
  askedBy: [{ id: 'p', name: 'Priya' }],
};

describe('mayJoinRequest', () => {
  it('offers somebody else’s request', () => {
    expect(mayJoinRequest(REQUESTED, 's')).toBe(true);
  });

  it('does not offer your own, a declined one, or one to nobody', () => {
    expect(mayJoinRequest(REQUESTED, 'p')).toBe(false);
    expect(mayJoinRequest({ ...REQUESTED, requestState: 'refused' }, 's')).toBe(false);
    expect(mayJoinRequest(REQUESTED, null)).toBe(false);
    expect(mayJoinRequest({ ...REQUESTED, askedBy: undefined }, 's')).toBe(false);
  });

  it('does not offer what is not asked for', () => {
    expect(
      mayJoinRequest(
        { status: 'askable', mediaId: null, requestId: null, requestState: null },
        's',
      ),
    ).toBe(false);
  });
});
