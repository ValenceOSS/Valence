import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { Judgement } from '@ValenceContracts/schemas/QualityProfile';

type Ranked = { releases: Release[]; judgements: Judgement[]; pickedId: string | null };

/**
 * Which band of popularity a release is in, so a few seeders more or less never outrank a better
 * indexer: none known, none, a few, tens, hundreds, and so on.
 *
 * @param release - The release.
 * @returns Its band, higher the more popular.
 */
const bandOf = (release: Pick<Release, 'seeders' | 'grabs'>): number => {
  const count = release.seeders ?? release.grabs;

  return count === null ? -1 : count === 0 ? 0 : Math.floor(Math.log10(count)) + 1;
};

/**
 * Puts judged releases in the order they would be chosen, the order Sonarr's is: everything that
 * may be taken before everything refused, then the best quality, then the best score, then
 * whichever fills the most of what is wanted, then the indexer asked first, then the most seeders
 * (or grabs, for usenet) by band, then the newest. The first that may be taken is the pick.
 *
 * Quality comes before what a release fills, so a better season pack is never passed over for a
 * worse pack that holds more seasons; between two of the same quality, the one that answers for
 * more is the better fetch. Where nobody says what each fills, as an interactive search does not,
 * they all fill nothing.
 *
 * @param releases - The releases.
 * @param judgements - How each was judged, by its id.
 * @param priorityOf - Each indexer's priority, by its id; the lowest is asked first.
 * @param fills - How many wanted films or episodes each would fetch, by release id.
 * @returns The releases and their judgements in that order, and the pick.
 */
const rankReleases = (
  releases: readonly Release[],
  judgements: readonly Judgement[],
  priorityOf: ReadonlyMap<string, number>,
  fills: ReadonlyMap<string, number> = new Map(),
): Ranked => {
  const judged = new Map(judgements.map((judgement) => [judgement.releaseId, judgement]));
  const pairs = releases.flatMap((release) => {
    const judgement = judged.get(release.id);

    return judgement === undefined ? [] : [{ release, judgement }];
  });

  const ordered = pairs.toSorted(
    (left, right) =>
      Number(left.judgement.isRejected) - Number(right.judgement.isRejected) ||
      right.judgement.quality - left.judgement.quality ||
      right.judgement.score - left.judgement.score ||
      (fills.get(right.release.id) ?? 0) - (fills.get(left.release.id) ?? 0) ||
      (priorityOf.get(left.release.indexerId) ?? 50) -
        (priorityOf.get(right.release.indexerId) ?? 50) ||
      bandOf(right.release) - bandOf(left.release) ||
      Date.parse(right.release.publishedAt ?? '1970-01-01') -
        Date.parse(left.release.publishedAt ?? '1970-01-01'),
  );

  return {
    releases: ordered.map((pair) => pair.release),
    judgements: ordered.map((pair) => pair.judgement),
    pickedId: ordered.find((pair) => !pair.judgement.isRejected)?.release.id ?? null,
  };
};

export { rankReleases };
