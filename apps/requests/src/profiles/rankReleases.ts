import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { Judgement } from '@ValenceContracts/schemas/QualityProfile';

type Ranked = { releases: Release[]; judgements: Judgement[]; pickedId: string | null };

/**
 * Puts judged releases in the order they would be chosen: everything that may be taken before
 * everything refused, then whichever fills the most of what is wanted, then the best score, and
 * between equals the most seeders (or grabs, for usenet), then the newest, then the indexer asked
 * first. The first that may be taken is the pick.
 *
 * What it fills comes before how well it scores because the profile has already said of everything
 * still standing that it may be taken. Between two releases a profile is content with, one that
 * answers for a whole season and one that answers for a single episode of it, the season is the
 * better fetch — and a profile that upgrades will improve on it later. Where nobody says what each
 * fills, as an interactive search does not, they all fill nothing and the score decides as before.
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
      (fills.get(right.release.id) ?? 0) - (fills.get(left.release.id) ?? 0) ||
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
