import type { Reencode } from '@ValenceContracts/schemas/Reencode';

const UNDER_WAY = ['queued', 'encoding', 'verifying'] as const;

type SortedReencodes = {
  awaitingReview: Reencode[];
  underWay: Reencode[];
  settled: Reencode[];
};

/**
 * Splits every re-encode into the three groups a screen shows them in.
 *
 * Waiting for judgement comes first wherever this is read, and it is the reason this function
 * exists rather than three filters at the call site. Forgotten encodes are the failure mode that
 * fills a disk: every one of them is holding both a film and its replacement until somebody looks,
 * and nothing hurries them.
 *
 * @param reencodes - Every re-encode the server knows about.
 * @returns Those waiting for somebody, those still being worked on, and those that are over.
 */
const sortReencodes = (reencodes: readonly Reencode[]): SortedReencodes => ({
  awaitingReview: reencodes.filter((one) => one.state === 'awaitingReview'),
  underWay: reencodes.filter((one) =>
    UNDER_WAY.some((state) => state === one.state),
  ),
  settled: reencodes.filter(
    (one) => one.state !== 'awaitingReview' && !UNDER_WAY.some((state) => state === one.state),
  ),
});

export type { SortedReencodes };

export { UNDER_WAY, sortReencodes };
