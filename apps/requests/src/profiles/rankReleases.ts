import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { Judgement } from '@ValenceContracts/schemas/QualityProfile';

type Ranked = { releases: Release[]; judgements: Judgement[]; pickedId: string | null };

/**
 * Puts judged releases in the order they would be chosen: everything that may be taken before
 * everything refused, then the best score, and between equals the most seeders (or grabs, for
 * usenet), then the newest, then the indexer asked first. The first that may be taken is the pick.
 *
 * @param releases - The releases.
 * @param judgements - How each was judged, by its id.
 * @param priorityOf - Each indexer's priority, by its id; the lowest is asked first.
 * @returns The releases and their judgements in that order, and the pick.
 */
const rankReleases = (
  releases: readonly Release[],
  judgements: readonly Judgement[],
  priorityOf: ReadonlyMap<string, number>,
): Ranked => {
  const judged = new Map(judgements.map((judgement) => [judgement.releaseId, judgement]));
  const pairs = releases.flatMap((release) => {
    const judgement = judged.get(release.id);

    return judgement === undefined ? [] : [{ release, judgement }];
  });

  const ordered = pairs.toSorted(
    (left, right) =>
      Number(left.judgement.isRejected) - Number(right.judgement.isRejected) ||
      right.judgement.score - left.judgement.score ||
      (right.release.seeders ?? right.release.grabs ?? -1) -
        (left.release.seeders ?? left.release.grabs ?? -1) ||
      Date.parse(right.release.publishedAt ?? '1970-01-01') -
        Date.parse(left.release.publishedAt ?? '1970-01-01') ||
      (priorityOf.get(left.release.indexerId) ?? 50) -
        (priorityOf.get(right.release.indexerId) ?? 50),
  );

  return {
    releases: ordered.map((pair) => pair.release),
    judgements: ordered.map((pair) => pair.judgement),
    pickedId: ordered.find((pair) => !pair.judgement.isRejected)?.release.id ?? null,
  };
};

export { rankReleases };
