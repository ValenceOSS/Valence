import type { BlockedReleaseRecord } from '@ValenceRequests/mediaRequests/BlockedReleaseRecord';

const LAPSES_AFTER_MS = 12 * 60 * 60 * 1000;

const PASSING: ReadonlySet<string> = new Set([
  'requests.downloads.judgeDownload.itNeverGotItsFileList',
  'requests.downloads.judgeDownload.itStalledWithNobodyToFetch',
]);

/**
 * Whether a release a request gave up on may be tried again: one that failed only because nobody
 * was sharing it just then — it never got its file list, or stalled with nobody to fetch from — is
 * given another chance half a day later, since whoever shares it may be back. Anything that failed
 * for what it is, rather than for who was about, stays given up on.
 *
 * @param block - Why and when it was given up on.
 * @param now - The time.
 * @returns Whether it may be tried again.
 */
const blockHasLapsed = (block: Pick<BlockedReleaseRecord, 'reason' | 'at'>, now: Date): boolean =>
  block.reason.code !== null &&
  PASSING.has(block.reason.code) &&
  now.getTime() - Date.parse(block.at) >= LAPSES_AFTER_MS;

export { blockHasLapsed };
