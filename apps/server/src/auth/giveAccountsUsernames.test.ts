import { describe, expect, it } from 'vitest';
import { giveAccountsUsernames } from './giveAccountsUsernames';
import type { UnnamedAccount } from './giveAccountsUsernames';

/**
 * Accounts held in memory, recording each username given back onto the account it was given to.
 */
const anAccountList = (accounts: UnnamedAccount[]) => ({
  accounts: () => Promise.resolve(accounts.map((account) => ({ ...account }))),
  assign: (accountId: string, username: string) => {
    const account = accounts.find((one) => one.id === accountId);

    if (account !== undefined) {
      account.username = username;
    }

    return Promise.resolve();
  },
});

describe('giveAccountsUsernames', () => {
  it('names every account that has no username, oldest first, never twice the same', async () => {
    const accounts = [
      { id: 'a', name: 'Pat', email: 'pat@example.com', username: null },
      { id: 'b', name: 'Pat', email: 'pat@example.org', username: null },
    ];

    await expect(giveAccountsUsernames(anAccountList(accounts))).resolves.toBe(2);
    expect(accounts.map((one) => one.username)).toEqual(['pat', 'pat1']);
  });

  it('leaves alone a username already held, and steers clear of it', async () => {
    const accounts = [
      { id: 'a', name: 'Pat', email: 'pat@example.com', username: 'Pat' },
      { id: 'b', name: 'Pat', email: 'pat@example.org', username: null },
    ];

    await expect(giveAccountsUsernames(anAccountList(accounts))).resolves.toBe(1);
    expect(accounts.map((one) => one.username)).toEqual(['Pat', 'pat1']);
  });

  it('changes nothing when it runs again', async () => {
    const accounts = [{ id: 'a', name: 'Pat', email: 'pat@example.com', username: null }];
    const list = anAccountList(accounts);

    await giveAccountsUsernames(list);

    await expect(giveAccountsUsernames(list)).resolves.toBe(0);
    expect(accounts[0]?.username).toBe('pat');
  });
});
