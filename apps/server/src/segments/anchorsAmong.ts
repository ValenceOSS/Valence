import type { SegmentCandidate } from './SegmentProvider';

/**
 * Chooses the few fingerprints every other one is held against: the references' first, then those
 * of the episodes being looked at, until there are enough. Holding each episode against a few
 * rather than against all the others keeps the work in step with the size of the season instead of
 * with its square, which in a season hundreds of episodes long is the difference between seconds and
 * the better part of an hour.
 *
 * @param prints - The fingerprints that could be taken, by item.
 * @param order - The episodes in the order to take them, references first.
 * @param most - How many to take.
 * @returns The fingerprints to hold the others against.
 */
const anchorsAmong = <Print extends { mediaId: string }>(
  prints: ReadonlyMap<string, Print>,
  order: readonly SegmentCandidate[],
  most: number,
): Print[] => {
  const anchors: Print[] = [];

  for (const one of order) {
    const print = prints.get(one.mediaId);

    if (print !== undefined && !anchors.some((held) => held.mediaId === print.mediaId)) {
      anchors.push(print);
    }

    if (anchors.length >= most) {
      break;
    }
  }

  return anchors;
};

export { anchorsAmong };
