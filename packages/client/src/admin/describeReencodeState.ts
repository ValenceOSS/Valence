import type { ReencodeState } from '@ValenceContracts/schemas/Reencode';

const WORDS = {
  queued: 'Waiting its turn',
  encoding: 'Encoding',
  verifying: 'Checking what came out',
  awaitingReview: 'Waiting for you',
  finished: 'Done',
  rejected: 'Rejected, original restored',
  failed: 'Failed',
  cancelled: 'Stopped',
} as const satisfies Record<ReencodeState, string>;

/**
 * What a re-encode is doing, in words rather than in a state name.
 *
 * "Waiting for you" rather than "awaiting review" on purpose. A queue of encodes nobody looks at is
 * the failure mode that fills a disk, and a row that says somebody has to do something is read
 * differently from one that merely describes itself.
 *
 * @param state - Where it has got to.
 * @returns What to say about it.
 */
const describeReencodeState = (state: ReencodeState): string => WORDS[state];

export { describeReencodeState };
