import type { KnownLikeness } from './createDatabaseLikenessStore';
import { titleKey } from './titleKey';

type IndexedTitle = KnownLikeness & {
  key: string;
  genres: ReadonlySet<number>;
  keywords: ReadonlySet<number>;
  keywordsWeight: number;
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
  const carrying = new Map<number, number>();
  const keyed = new Map<string, KnownLikeness>();

  for (const title of known) {
    keyed.set(titleKey(title.kind, title.catalogueId), title);

    for (const keyword of new Set(title.likeness.keywords)) {
      carrying.set(keyword, (carrying.get(keyword) ?? 0) + 1);
    }
  }

  const keywordWeight = (keyword: number) =>
    Math.log(1 + keyed.size / (carrying.get(keyword) ?? 1));
  const titles = new Map<string, IndexedTitle>();

  for (const [key, title] of keyed) {
    const keywords = new Set(title.likeness.keywords);
    let keywordsWeight = 0;

    for (const keyword of keywords) {
      keywordsWeight += keywordWeight(keyword);
    }

    titles.set(key, {
      ...title,
      key,
      genres: asFilmGenres(title.likeness.genres),
      keywords,
      keywordsWeight,
      cast: new Set(title.likeness.cast),
      crew: new Set(title.likeness.crew),
    });
  }

  return { titles, keywordWeight };
};

export type { IndexedTitle, LikenessIndex };

export { GENRE_TWINS, indexLikeness };
