import type { Artwork } from '@ValenceClient/library/artworkUrl';

type Named = { addresses: Partial<Record<Artwork | 'titleBackdrop', string>>; revision: number };

const named = new Map<string, Named>();

/**
 * Reads where one of an item's pictures is served by name, as the server last said, unless its
 * pictures have been changed since then. The title's own backdrop is named apart, since an
 * episode's programme may have had one chosen for it as a whole.
 *
 * @param mediaId - The item.
 * @param kind - Which picture.
 * @param revision - The revision its pictures are asked for at now.
 * @param isOfTitle - Whether the title's own picture is wanted rather than this file's.
 * @returns The address, to which a width and `.webp` are added, or nothing where none is known.
 */
const of = (
  mediaId: string,
  kind: Artwork,
  revision: number,
  isOfTitle = false,
): string | undefined => {
  const known = named.get(mediaId);

  return known === undefined || revision > known.revision
    ? undefined
    : known.addresses[isOfTitle && kind === 'backdrop' ? 'titleBackdrop' : kind];
};

/**
 * Notes where the server serves each item's pictures by name, with the revision they were named at,
 * so a card asks for its picture there rather than being sent there. What was known of the same
 * revision is kept beside it, since a programme names only those of its cover's pictures that are
 * the programme's own.
 *
 * @param entries - The items read, each with the addresses the server sent, where it sent any.
 */
const learn = (
  entries: readonly {
    id: string;
    artworkRevision?: number | undefined;
    artwork?: Partial<Record<Artwork | 'titleBackdrop', string | undefined>> | undefined;
  }[],
): void => {
  for (const { id, artworkRevision, artwork } of entries) {
    if (artwork !== undefined) {
      const revision = artworkRevision ?? 0;
      const known = named.get(id);
      const given = Object.fromEntries(
        Object.entries(artwork).filter((entry) => entry[1] !== undefined),
      );

      named.set(id, {
        addresses: known?.revision === revision ? { ...known.addresses, ...given } : given,
        revision,
      });
    }
  }
};

const artworkAddresses = { of, learn };

export { artworkAddresses };
