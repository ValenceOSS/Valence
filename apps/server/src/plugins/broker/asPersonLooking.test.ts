import { describe, expect, it } from 'vitest';
import { asPersonLooking } from './asPersonLooking';

const PERSON = { accountId: 'a1', profileId: 'p1' };

describe('asPersonLooking', () => {
  it('acts as the person, never as an administrator', () => {
    expect(
      asPersonLooking(PERSON, {
        kind: 'account',
        accountId: 'a1',
        profileId: 'p1',
        isAdministrator: true,
      }),
    ).toEqual({ kind: 'account', accountId: 'a1', profileId: 'p1', isAdministrator: false });
  });

  it('keeps locked what is still locked to them', () => {
    expect(
      asPersonLooking(PERSON, {
        kind: 'account',
        accountId: 'a1',
        profileId: 'p1',
        isAdministrator: false,
        lockedLibraries: ['l1'],
      }),
    ).toMatchObject({ lockedLibraries: ['l1'] });
    expect(asPersonLooking(PERSON, { kind: 'server' })).not.toHaveProperty('lockedLibraries');
  });
});
