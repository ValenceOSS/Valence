import { describe, expect, it } from 'vitest';
import { unlockToken } from './unlockToken';
import { unlockedLibraries } from './unlockedLibraries';

const SECRET = 'server-secret';
const LOCKS = { kids: { hash: 'h1', relockMinutes: 60 } };

describe('unlockedLibraries', () => {
  it('reads a library its token unlocks for the account, until it runs out', () => {
    const token = unlockToken(
      { libraryId: 'kids', accountId: 'ada', hash: 'h1', untilMs: 2000 },
      SECRET,
    );

    expect(unlockedLibraries(token, 'ada', LOCKS, SECRET, 1000)).toEqual(new Set(['kids']));
    expect(unlockedLibraries(token, 'ada', LOCKS, SECRET, 3000)).toEqual(new Set());
  });

  it('refuses a token made for somebody else, or under another password', () => {
    const theirs = unlockToken(
      { libraryId: 'kids', accountId: 'bo', hash: 'h1', untilMs: 2000 },
      SECRET,
    );
    const before = unlockToken(
      { libraryId: 'kids', accountId: 'ada', hash: 'h0', untilMs: 2000 },
      SECRET,
    );

    expect(unlockedLibraries(theirs, 'ada', LOCKS, SECRET, 1000)).toEqual(new Set());
    expect(unlockedLibraries(before, 'ada', LOCKS, SECRET, 1000)).toEqual(new Set());
  });

  it('refuses a token that has been tampered with', () => {
    const token = unlockToken(
      { libraryId: 'kids', accountId: 'ada', hash: 'h1', untilMs: 2000 },
      SECRET,
    );

    expect(unlockedLibraries(token.replace('2000', '9999'), 'ada', LOCKS, SECRET, 1000)).toEqual(
      new Set(),
    );
  });
});
