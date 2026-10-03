import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * The copy of a title to play where somebody would rather have the best one: a linked server's copy
 * where it is clearly sharper than this server's own and that server can be reached, or nothing,
 * which plays this server's own as always.
 *
 * @param title - This server's own copy.
 * @param copies - Every other copy of it.
 * @param isReachableElsewhere - Whether a copy is on a linked server that can be reached; false for
 *   one of this server's own.
 * @returns The id of the copy to play instead, or nothing.
 */
const bestCopyOf = (
  title: Pick<MediaSummary, 'height'>,
  copies: readonly Pick<MediaSummary, 'id' | 'height' | 'libraryId'>[],
  isReachableElsewhere: (libraryId: string) => boolean,
): string | null => {
  const better = copies
    .filter((copy) => isReachableElsewhere(copy.libraryId) && copy.height > title.height)
    .sort((one, other) => other.height - one.height)[0];

  return better?.id ?? null;
};

export { bestCopyOf };
