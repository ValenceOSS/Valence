import { say } from '@ValenceI18n/say';
import type { HomeShelf } from '@ValenceContracts/schemas/HomeShelves';

/**
 * What to call a shelf of the front page, from what it is drawn from: a genre by its name, a decade
 * the way somebody says it, and a genre seen from another angle — the newest of it, the whole of it
 * by name, the part of it from one decade, or the next of its best.
 *
 * @param shelf - What the shelf is drawn from.
 * @returns What the shelf says it is.
 */
const shelfTitle = ({
  genre,
  order,
  decade,
  page,
}: Pick<HomeShelf, 'genre' | 'order' | 'decade' | 'page'>): string => {
  if (genre === null) {
    return say('client.library.homeRows.fromTheDecadeS', { decade: (decade ?? 0).toString() });
  }

  if (page > 0) {
    return say('client.library.useHomeRows.moreGenre', { genre });
  }

  if (decade !== null) {
    return say('client.library.useHomeRows.genreFromTheDecadeS', {
      genre,
      decade: decade.toString(),
    });
  }

  if (order === 'newest') {
    return say('client.library.useHomeRows.newInGenre', { genre });
  }

  return order === 'title' ? `${genre} A–Z` : genre;
};

export { shelfTitle };
