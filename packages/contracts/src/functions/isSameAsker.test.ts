import { describe, expect, it } from 'vitest';
import { isSameAsker } from './isSameAsker';

const KID = { profileId: 'p-kid', name: 'Kid' };
const PARENT = { profileId: 'p-parent', name: 'Parent' };

describe('isSameAsker', () => {
  it('holds for the same profile on the same account', () => {
    expect(isSameAsker({ id: 'a', askingProfile: KID }, { id: 'a', askingProfile: KID })).toBe(
      true,
    );
  });

  it('tells two profiles on one account apart', () => {
    expect(isSameAsker({ id: 'a', askingProfile: KID }, { id: 'a', askingProfile: PARENT })).toBe(
      false,
    );
  });

  it('holds for nobody on another account, even with the same profile', () => {
    expect(isSameAsker({ id: 'a', askingProfile: KID }, { id: 'b', askingProfile: KID })).toBe(
      false,
    );
    expect(isSameAsker({ id: 'a' }, { id: 'b' })).toBe(false);
  });

  it('matches an asker recorded without a profile to any profile on its account', () => {
    expect(isSameAsker({ id: 'a' }, { id: 'a', askingProfile: KID })).toBe(true);
    expect(isSameAsker({ id: 'a', askingProfile: PARENT }, { id: 'a', askingProfile: null })).toBe(
      true,
    );
    expect(isSameAsker({ id: 'a', askingProfile: null }, { id: 'a' })).toBe(true);
  });
});
