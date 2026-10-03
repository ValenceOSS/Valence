import { say } from '@ValenceI18n/say';

/**
 * What to say about where a title comes from, among the facts about it: which linked server, or
 * that the server cannot be reached and the title cannot be played until it is back. Nothing for
 * something of this server's own.
 *
 * @param origin - Where it comes from, as `useOriginOf` reads it, or nothing.
 * @returns The words, or nothing.
 */
const whereFrom = (
  origin: { name: string; label: string; isReachable: boolean } | null,
): string | null => {
  if (origin === null) {
    return null;
  }

  return origin.isReachable
    ? origin.label
    : say('common.nameCannotBeReachedRightNow', { name: origin.name });
};

export { whereFrom };
