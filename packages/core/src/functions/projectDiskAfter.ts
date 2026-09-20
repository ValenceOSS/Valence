import type { ReencodeMode } from '@ValenceContracts/schemas/Reencode';

type Weighable = {
  sizeBytes: number;
  estimatedBytes: number | null;
};

type Projection = {
  nowBytes: number;
  afterBytes: number;
};

/**
 * What the chosen files take now, and what they would take afterwards.
 *
 * Worth showing both ways round and at the point of choosing, because "re-encode" reads as "saves
 * space" and in one of the two modes it does the exact opposite. Replacing frees disk; keeping a
 * rendition alongside spends it, to buy a household that never transcodes at seven o'clock on a
 * Sunday. A number that only ever went down would quietly mislead half the people using this.
 *
 * A file nothing could be estimated for is counted at its current size rather than dropped, so the
 * total never reads as smaller than it will be.
 *
 * @param candidates - What is being worked on, each with its size now and the estimate for after.
 * @param mode - Whether the encode takes the original's place or sits beside it.
 * @returns The totals before and after.
 */
const projectDiskAfter = (candidates: readonly Weighable[], mode: ReencodeMode): Projection => {
  const nowBytes = candidates.reduce((total, one) => total + one.sizeBytes, 0);

  if (mode === 'keep') {
    return {
      nowBytes,
      afterBytes: candidates.reduce(
        (total, one) => total + one.sizeBytes + (one.estimatedBytes ?? 0),
        0,
      ),
    };
  }

  return {
    nowBytes,
    afterBytes: candidates.reduce((total, one) => total + (one.estimatedBytes ?? one.sizeBytes), 0),
  };
};

export type { Projection, Weighable };

export { projectDiskAfter };
