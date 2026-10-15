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
    expect(mayJoinRequest(REQUESTED, { accountId: 's', profileId: null })).toBe(true);
  });

  it('does not offer your own, a declined one, or one to nobody', () => {
    expect(mayJoinRequest(REQUESTED, { accountId: 'p', profileId: null })).toBe(false);
    expect(
      mayJoinRequest(
        { ...REQUESTED, requestState: 'refused' },
        { accountId: 's', profileId: null },
      ),
    ).toBe(false);
    expect(mayJoinRequest(REQUESTED, null)).toBe(false);
    expect(
      mayJoinRequest({ ...REQUESTED, askedBy: undefined }, { accountId: 's', profileId: null }),
    ).toBe(false);
  });

  it('does not offer what is not asked for', () => {
    expect(
      mayJoinRequest(
        { status: 'askable', mediaId: null, requestId: null, requestState: null },
        { accountId: 's', profileId: null },
      ),
    ).toBe(false);
  });

  it('offers a request to another profile on the account of the profile that asked', () => {
    const askedByKid = {
      ...REQUESTED,
      askedBy: [{ id: 'p', name: 'Priya', askingProfile: { profileId: 'p-kid', name: 'Kid' } }],
    };

    expect(mayJoinRequest(askedByKid, { accountId: 'p', profileId: 'p-parent' })).toBe(true);
    expect(mayJoinRequest(askedByKid, { accountId: 'p', profileId: 'p-kid' })).toBe(false);
  });

  it('does not offer a request asked without a profile to any profile on its account', () => {
    expect(mayJoinRequest(REQUESTED, { accountId: 'p', profileId: 'p-parent' })).toBe(false);
  });
});
