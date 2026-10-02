import { describe, expect, it } from 'vitest';
import { accountOfRequester } from './accountOfRequester';

const ACCOUNTS = [
  { id: 'sam', name: 'Sam', email: 'sam@example.com' },
  { id: 'robin', name: 'Robin', email: 'robin@no-email.invalid' },
  { id: 'alex', name: 'Alex', email: 'alex@example.com' },
];

const IMPORTED = [
  { sourceKind: 'plex', sourceKey: '1234567', accountId: 'sam' },
  { sourceKind: 'jellyfin', sourceKey: '6F1A2B3C-4D5E-6F70-8192-A3B4C5D6E7F8', accountId: 'robin' },
];

const NOBODY = { name: 'Nobody', email: null, plexId: null, jellyfinUserId: null };

describe('accountOfRequester', () => {
  it('finds the account an import made for the Plex or Jellyfin account behind somebody', () => {
    expect(accountOfRequester({ ...NOBODY, plexId: 1_234_567 }, IMPORTED, ACCOUNTS)).toEqual({
      id: 'sam',
      name: 'Sam',
    });
    expect(
      accountOfRequester(
        { ...NOBODY, jellyfinUserId: '6f1a2b3c4d5e6f708192a3b4c5d6e7f8' },
        IMPORTED,
        ACCOUNTS,
      ),
    ).toEqual({ id: 'robin', name: 'Robin' });
  });

  it('finds somebody by the address they signed in with, but never by a placeholder', () => {
    expect(
      accountOfRequester({ ...NOBODY, email: 'ALEX@example.com' }, IMPORTED, ACCOUNTS),
    ).toEqual({ id: 'alex', name: 'Alex' });
    expect(
      accountOfRequester({ ...NOBODY, email: 'robin@no-email.invalid' }, [], ACCOUNTS),
    ).toBeNull();
  });

  it('finds nobody where neither says who they are', () => {
    expect(accountOfRequester({ ...NOBODY, plexId: 99 }, IMPORTED, ACCOUNTS)).toBeNull();
  });
});
