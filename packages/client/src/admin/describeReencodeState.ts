import type { ReencodeState } from '@ValenceContracts/schemas/Reencode';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const WORDS = {
  queued: 'client.describeReencodeState.queued',
  encoding: 'client.describeReencodeState.encoding',
  verifying: 'client.describeReencodeState.verifying',
  awaitingReview: 'client.describeReencodeState.awaitingReview',
  finished: 'client.describeReencodeState.finished',
  rejected: 'client.describeReencodeState.rejected',
  failed: 'client.describeReencodeState.failed',
  cancelled: 'client.describeReencodeState.cancelled',
} as const satisfies Record<ReencodeState, StringKey>;

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
const describeReencodeState = (state: ReencodeState): string => say(WORDS[state]);

export { describeReencodeState };
