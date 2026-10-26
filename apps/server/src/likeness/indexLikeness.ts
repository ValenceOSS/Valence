import type { KnownLikeness } from './createDatabaseLikenessStore';
import { titleKey } from './titleKey';

type IndexedTitle = KnownLikeness & {
  key: string;
  genres: ReadonlySet<number>;
  keywords: ReadonlySet<number>;
  cast: ReadonlySet<number>;
  crew: ReadonlySet<number>;
};

type LikenessIndex = {
  titles: ReadonlyMap<string, IndexedTitle>;
  keywordWeight: (keyword: number) => number;
};

const GENRE_TWINS: Readonly<Record<number, readonly number[]>> = {
  10759: [28, 12],
  10762: [10751],
  10765: [878, 14],
  10768: [10752],
};

/**
 * Reads a title's genres in the film catalogue's terms, a programme's broader genres standing for
 * the film genres they join, so that a film and a programme can be compared by genre at all.
 *
 * @param genres - The genres as the catalogue gave them.
 * @returns The genres, in film terms.
 */
const asFilmGenres = (genres: readonly number[]): Set<number> =>
  new Set(genres.flatMap((genre) => GENRE_TWINS[genre] ?? [genre]));

/**
 * Gathers what every title in the libraries is like into one place to compare them from, with how
 * rare each keyword is: a keyword nearly everything carries says little about two titles sharing it.
 *
 * @param known - What each title is like.
 * @returns The index.
 */
const indexLikeness = (known: readonly KnownLikeness[]): LikenessIndex => {
  const titles = new Map<string, IndexedTitle>();
  const carrying = new Map<number, number>();

  for (const title of known) {
    const key = titleKey(title.kind, title.catalogueId);

    titles.set(key, {
      ...title,
      key,
      genres: asFilmGenres(title.likeness.genres),
      keywords: new Set(title.likeness.keywords),
      cast: new Set(title.likeness.cast),
      crew: new Set(title.likeness.crew),
    });

    for (const keyword of new Set(title.likeness.keywords)) {
      carrying.set(keyword, (carrying.get(keyword) ?? 0) + 1);
    }
  }

  return {
    titles,
    keywordWeight: (keyword) => Math.log(1 + titles.size / (carrying.get(keyword) ?? 1)),
  };
};

export type { IndexedTitle, LikenessIndex };

export { GENRE_TWINS, indexLikeness };
