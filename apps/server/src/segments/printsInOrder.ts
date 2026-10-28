import type { SegmentCandidate } from './SegmentProvider';

/**
 * Puts the fingerprints in the order they are to be held against the others: the references' first,
 * then those of the episodes being looked at. Episodes that could not be listened to have no
 * fingerprint and are passed over, and an episode named twice is taken once.
 *
 * @param prints - The fingerprints there are, by item.
 * @param order - The episodes in the order to take them, references first.
 * @returns The fingerprints, in that order.
 */
const printsInOrder = <Print extends { mediaId: string }>(
  prints: ReadonlyMap<string, Print>,
  order: readonly SegmentCandidate[],
): Print[] => {
  const ordered: Print[] = [];

  for (const one of order) {
    const print = prints.get(one.mediaId);

    if (print !== undefined && !ordered.some((held) => held.mediaId === print.mediaId)) {
      ordered.push(print);
    }
  }

  return ordered;
};

export { printsInOrder };
