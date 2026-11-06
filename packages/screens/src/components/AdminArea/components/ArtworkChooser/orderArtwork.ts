import type { ArtworkOption } from '@ValenceContracts/schemas/ArtworkChoice';
import type { ARTWORK_ORDERS } from './ARTWORK_ORDERS';

/**
 * Puts the catalogue's pictures in the order an administrator asked for: the catalogue's own, most
 * votes first, most pixels first, or the ones with no lettering first, each keeping the catalogue's
 * order among equals.
 *
 * @param options - The pictures, in the catalogue's order.
 * @param order - The order asked for.
 * @returns The pictures in that order, each with where the catalogue ranked it.
 */
const orderArtwork = (
  options: readonly ArtworkOption[],
  order: (typeof ARTWORK_ORDERS)[number],
): { option: ArtworkOption; rank: number }[] => {
  const ranked = options.map((option, at) => ({ option, rank: at + 1 }));
  const weightOf = ({ option }: { option: ArtworkOption }): number =>
    order === 'votes'
      ? option.votes
      : order === 'largest'
        ? option.width * option.height
        : order === 'bare'
          ? Number(option.language === null)
          : 0;

  return ranked.toSorted((one, other) => weightOf(other) - weightOf(one) || one.rank - other.rank);
};

export { orderArtwork };
