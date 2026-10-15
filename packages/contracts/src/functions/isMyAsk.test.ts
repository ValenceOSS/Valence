import { describe, expect, it } from 'vitest';
import { isMyAsk } from './isMyAsk';

const KID = { profileId: 'p-kid', name: 'Kid' };

describe('isMyAsk', () => {
  it('holds for the profile looking on its own account', () => {
    expect(isMyAsk({ id: 'a', askingProfile: KID }, { accountId: 'a', profileId: 'p-kid' })).toBe(
      true,
    );
  });

  it('holds for nobody else on the same account', () => {
    expect(
      isMyAsk({ id: 'a', askingProfile: KID }, { accountId: 'a', profileId: 'p-parent' }),
    ).toBe(false);
  });

  it('holds for nobody on another account', () => {
    expect(isMyAsk({ id: 'b', askingProfile: KID }, { accountId: 'a', profileId: 'p-kid' })).toBe(
      false,
    );
    expect(isMyAsk({ id: 'b' }, { accountId: 'a', profileId: null })).toBe(false);
  });

  it('holds for any profile on the account where the ask was made without one', () => {
    expect(isMyAsk({ id: 'a' }, { accountId: 'a', profileId: 'p-parent' })).toBe(true);
    expect(isMyAsk({ id: 'a', askingProfile: null }, { accountId: 'a', profileId: 'p-kid' })).toBe(
      true,
    );
  });

  it('holds for any ask on the account where the person looking has no profile chosen', () => {
    expect(isMyAsk({ id: 'a', askingProfile: KID }, { accountId: 'a', profileId: null })).toBe(
      true,
    );
  });

  it('holds for nothing where nobody is looking', () => {
    expect(isMyAsk({ id: 'a', askingProfile: KID }, null)).toBe(false);
    expect(isMyAsk({ id: 'a' }, null)).toBe(false);
  });
});
