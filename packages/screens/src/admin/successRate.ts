import type { BadgeTone } from '@ValenceUI/Badge.types';

/**
 * How reliably a kind of job has finished: the share of the runs that ended that ended well. A run
 * still going has not ended either way, so it counts for neither side.
 *
 * @param completed - How many runs ended well.
 * @param failed - How many ended badly.
 * @returns The share from nought to one, or nothing where no run has ended.
 */
const successRate = (completed: number, failed: number): number | null =>
  completed + failed === 0 ? null : completed / (completed + failed);

/**
 * Says how a success rate should be judged, in the colour of the badge that shows it: a job that
 * nearly always finishes is fine, one that fails one run in ten wants looking at, and one that
 * fails more is broken.
 *
 * @param rate - The share of runs that ended well, or nothing where none has ended.
 * @returns The tone to paint it in.
 */
const toneOfSuccessRate = (rate: number | null): BadgeTone => {
  if (rate === null) {
    return 'quiet';
  }

  if (rate >= 0.99) {
    return 'success';
  }

  return rate >= 0.9 ? 'warning' : 'danger';
};

export { successRate, toneOfSuccessRate };
