import { describe, expect, it } from 'vitest';
import { unlockHolderOf } from './unlockHolderOf';

describe('unlockHolderOf', () => {
  it('signs an unlocking for one profile on one account', () => {
    expect(unlockHolderOf({ accountId: 'account-1', profileId: 'kid' })).toBe('account-1/kid');
  });

  it('signs it for the account alone where no profile is acting', () => {
    expect(unlockHolderOf({ accountId: 'account-1', profileId: null })).toBe('account-1/');
  });

  it('keeps two profiles on the same account apart', () => {
    expect(unlockHolderOf({ accountId: 'account-1', profileId: 'parent' })).not.toBe(
      unlockHolderOf({ accountId: 'account-1', profileId: 'kid' }),
    );
  });

  it('keeps the same profile name on two accounts apart', () => {
    expect(unlockHolderOf({ accountId: 'account-1', profileId: 'kid' })).not.toBe(
      unlockHolderOf({ accountId: 'account-2', profileId: 'kid' }),
    );
  });
});
