import { useQuery } from '@tanstack/react-query';
import { bestCopyOf } from '@ValenceClient/linking/bestCopyOf';
import { useOriginOf } from '@ValenceClient/linking/useOriginOf';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * The copy of a title to play for somebody who would rather have the best one: a linked server's
 * copy where it is clearly sharper than this server's own and that server can be reached, or
 * nothing, which plays this server's own as always — and nothing for anybody who has not asked.
 *
 * @param title - This server's own copy, or nothing while it is read.
 * @param copies - Every other copy of it.
 * @returns The id of the copy to play instead, or nothing.
 */
const usePreferredCopy = (
  title: Pick<MediaSummary, 'height'> | null | undefined,
  copies: readonly Pick<MediaSummary, 'id' | 'height' | 'libraryId'>[],
): string | null => {
  const originOf = useOriginOf();
  const watchingNow = useQuery(profileQueries.watching());

  return watchingNow.data?.prefersBestCopy === true && title !== null && title !== undefined
    ? bestCopyOf(title, copies, (libraryId) => originOf(libraryId)?.isReachable === true)
    : null;
};

export { usePreferredCopy };
