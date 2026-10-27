import type { IndexedTitle, LikenessIndex } from './indexLikeness';
import { titleKey } from './titleKey';

type Ranked = { key: string; score: number };

const RECOMMENDED = 4;

const RECOMMENDS_BACK = 2;

const KEYWORDS = 3;

const GENRES = 1.5;

const MAKER = 1.5;

const MAKERS_COUNTED = 2;

const CAST_MEMBER = 0.5;

const CAST_COUNTED = 4;

const FLOOR = 0.75;

/**
 * Counts what two sets hold in common.
 *
 * @param left - One set.
 * @param right - The other.
 * @returns What both hold.
 */
const sharedBy = <Item>(left: ReadonlySet<Item>, right: ReadonlySet<Item>): Item[] =>
  [...left].filter((item) => right.has(item));

/**
 * Ranks the titles in the libraries by how like one title they are: those the catalogue recommends
 * beside it first, then by the keywords they share, weighted by how rare each is, their genres, who
 * made them and who is in them. Titles that share too little are left out rather than ranked low.
 *
 * @param index - What every title is like.
 * @param sourceKey - The title to find others like.
 * @param leaveOut - Titles not to offer, beyond the title itself.
 * @returns The titles, most alike first.
 */
const rankLikeness = (
  index: LikenessIndex,
  sourceKey: string,
  leaveOut: ReadonlySet<string> = new Set(),
): Ranked[] => {
  const source = index.titles.get(sourceKey);

  if (source === undefined) {
    return [];
  }

  const recommended = source.likeness.recommendations;
  const placeOf = new Map(
    recommended.map((catalogueId, at) => [titleKey(source.kind, catalogueId.toString()), at]),
  );
  const sourceId = Number(source.catalogueId);
  const weightOf = (keywords: Iterable<number>) =>
    [...keywords].reduce((sum, keyword) => sum + index.keywordWeight(keyword), 0);
  const sourceWeight = weightOf(source.keywords);

  /**
   * Scores how like the title one other is.
   *
   * @param other - The other title.
   * @returns The score, higher being more alike.
   */
  const likenessOf = (other: IndexedTitle): number => {
    const place = placeOf.get(other.key);
    const otherWeight = weightOf(other.keywords);
    const genresShared = sharedBy(source.genres, other.genres).length;
    const genresEither = new Set([...source.genres, ...other.genres]).size;

    return (
      (place === undefined ? 0 : RECOMMENDED * (1 - place / (2 * recommended.length))) +
      (other.kind === source.kind && other.likeness.recommendations.includes(sourceId)
        ? RECOMMENDS_BACK
        : 0) +
      (sourceWeight === 0 || otherWeight === 0
        ? 0
        : (KEYWORDS * weightOf(sharedBy(source.keywords, other.keywords))) /
          Math.sqrt(sourceWeight * otherWeight)) +
      (genresEither === 0 ? 0 : (GENRES * genresShared) / genresEither) +
      MAKER * Math.min(sharedBy(source.crew, other.crew).length, MAKERS_COUNTED) +
      CAST_MEMBER * Math.min(sharedBy(source.cast, other.cast).length, CAST_COUNTED)
    );
  };

  return [...index.titles.values()]
    .filter((other) => other.key !== sourceKey && !leaveOut.has(other.key))
    .map((other) => ({ key: other.key, score: likenessOf(other) }))
    .filter((ranked) => ranked.score >= FLOOR)
    .toSorted((left, right) => right.score - left.score || left.key.localeCompare(right.key));
};

export type { Ranked };

export { rankLikeness };
