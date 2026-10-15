import { timingSafeEqual } from 'node:crypto';
import { unlockToken } from '@ValenceServer/locks/unlockToken';
import type { LibraryLocks } from '@ValenceContracts/schemas/LibraryLock';

/**
 * Reads which locked libraries a request may see: those its tokens unlock, for its own account, with
 * the lock as it stands now, and not yet run out.
 *
 * @param tokens - The tokens the request carries, separated by spaces.
 * @param accountId - Who is asking.
 * @param locks - The locks kept, library by library.
 * @param secret - The server's own secret.
 * @param nowMs - The moment it is.
 * @returns The libraries unlocked.
 */
const unlockedLibraries = (
  tokens: string,
  accountId: string,
  locks: LibraryLocks,
  secret: string,
  nowMs: number,
): Set<string> => {
  const unlocked = new Set<string>();

  for (const token of tokens.split(' ')) {
    const [libraryId = '', until = ''] = token.split('.');
    const lock = locks[libraryId];
    const untilMs = Number(until);

    if (lock === undefined || !Number.isFinite(untilMs) || untilMs <= nowMs) {
      continue;
    }

    const expected = Buffer.from(
      unlockToken({ libraryId, accountId, hash: lock.hash, untilMs }, secret),
    );
    const given = Buffer.from(token);

    if (given.length === expected.length && timingSafeEqual(given, expected)) {
      unlocked.add(libraryId);
    }
  }

  return unlocked;
};

export { unlockedLibraries };
