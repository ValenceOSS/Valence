import { useQueries, useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { useOriginOf } from '@ValenceClient/linking/useOriginOf';
import { isEpisodicKind } from '@ValenceContracts/functions/isEpisodicKind';
import type { ShowSummary } from '@ValenceContracts/schemas/Show';

type ShowCopy = {
  show: ShowSummary;
  server: string | null;
  isReachable: boolean;
};

/**
 * A programme's title as two libraries might each spell it: lower case, without accents,
 * punctuation or a leading "the".
 *
 * @param title - The title.
 * @returns It reduced.
 */
const keyOf = (title: string): string =>
  title
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/^the /u, '');

/**
 * Every copy of a programme the libraries hold — this server's own and each linked server's — so
 * whoever is watching can choose which to play it from: the same title, and the same year where
 * both say one. This server's comes first, then the rest by how many episodes each has.
 *
 * @param show - The programme open, or nothing.
 * @returns Its copies, the one open among them, each with the server it is on (nothing for this
 *   one) and whether that server can be reached.
 */
const useShowCopies = (show: ShowSummary | null): ShowCopy[] => {
  const originOf = useOriginOf();
  const libraries = useQuery(libraryQueries.all());
  const episodic = (libraries.data ?? []).filter((library) => isEpisodicKind(library.kind));
  const lists = useQueries({
    queries: episodic.map((library) => ({
      ...libraryQueries.shows(library.id),
      enabled: show !== null,
    })),
  });

  if (show === null) {
    return [];
  }

  const wanted = keyOf(show.title);
  const copies = lists
    .flatMap((list) => list.data ?? [])
    .filter(
      (one) =>
        one.id === show.id ||
        (keyOf(one.title) === wanted &&
          (one.year === null ||
            one.year === undefined ||
            show.year === null ||
            show.year === undefined ||
            one.year === show.year)),
    );

  return (copies.some((one) => one.id === show.id) ? copies : [show, ...copies])
    .map((one) => {
      const origin = originOf(one.libraryId);

      return {
        show: one,
        server: origin?.name ?? null,
        isReachable: origin?.isReachable ?? true,
      };
    })
    .toSorted(
      (one, other) =>
        Number(one.server !== null) - Number(other.server !== null) ||
        other.show.episodeCount - one.show.episodeCount,
    );
};

export type { ShowCopy };

export { useShowCopies };
