import { describe, expect, it } from 'vitest';
import { askerFieldsOf } from './askerFieldsOf';

const KID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

describe('askerFieldsOf', () => {
  it('names the account and the profile on it that asked', () => {
    expect(
      askerFieldsOf({
        id: 'account-1',
        name: 'Dan',
        askingProfile: { profileId: KID, name: 'Kid' },
      }),
    ).toEqual({ accountId: 'account-1', profileId: KID, profileName: 'Kid' });
  });

  it('names only the account where nobody knows which profile asked', () => {
    expect(askerFieldsOf({ id: 'account-1', name: 'Dan', askingProfile: null })).toEqual({
      accountId: 'account-1',
      profileId: null,
      profileName: null,
    });
    expect(askerFieldsOf({ id: 'account-1', name: 'Dan' })).toEqual({
      accountId: 'account-1',
      profileId: null,
      profileName: null,
    });
  });

  it('goes by the asking profile rather than the face the account is drawn with', () => {
    expect(
      askerFieldsOf({
        id: 'account-1',
        name: 'Dan',
        profileId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        profileName: 'Dan',
        askingProfile: { profileId: KID, name: 'Kid' },
      }),
    ).toEqual({ accountId: 'account-1', profileId: KID, profileName: 'Kid' });
  });
});
