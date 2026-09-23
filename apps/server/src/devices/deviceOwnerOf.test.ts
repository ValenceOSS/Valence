import { describe, expect, it } from 'vitest';
import { deviceOwnerOf } from '@ValenceServer/devices/deviceOwnerOf';

describe('deviceOwnerOf', () => {
  it('owns the devices of the account and profile asking', () => {
    expect(
      deviceOwnerOf({ kind: 'account', accountId: 'acc', profileId: 'me', isAdministrator: false }),
    ).toEqual({ accountId: 'acc', profileId: 'me' });
  });

  it('owns the whole account’s devices where no profile has been chosen', () => {
    expect(
      deviceOwnerOf({ kind: 'account', accountId: 'acc', profileId: null, isAdministrator: true }),
    ).toEqual({ accountId: 'acc', profileId: null });
  });

  it('owns nothing where nobody is signed in', () => {
    expect(deviceOwnerOf(null)).toBeNull();
  });

  it('owns nothing for a guest on a shared link', () => {
    expect(deviceOwnerOf({ kind: 'guest', shareId: 'share-1' })).toBeNull();
  });

  it('owns nothing for the server itself', () => {
    expect(deviceOwnerOf({ kind: 'server' })).toBeNull();
  });
});
