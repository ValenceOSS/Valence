import { describe, expect, it } from 'vitest';
import { profilesAddress } from './profilesAddress';

describe('profilesAddress', () => {
  it('points at the signed-in account’s own profiles where no account is named', () => {
    expect(profilesAddress()).toBe('/api/profiles');
  });

  it('points at another account’s profiles in the admin area', () => {
    expect(profilesAddress('acc-1')).toBe('/api/admin/accounts/acc-1/profiles');
  });

  it('keeps an account’s id from reaching past its own place in the address', () => {
    expect(profilesAddress('a/b?c')).toBe('/api/admin/accounts/a%2Fb%3Fc/profiles');
  });
});
