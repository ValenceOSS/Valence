import { z } from 'zod';
import type { MediaSegment } from './MediaSegment';

const WatchProgressSchema = z.object({
  mediaId: z.string().uuid(),
  positionSeconds: z.number().nonnegative(),
  durationSeconds: z.number().positive(),
  isFinished: z.boolean(),
  updatedAt: z.string().datetime(),
});

const WatchProgressListSchema = z.object({ progress: z.array(WatchProgressSchema) });

const STARTED_AFTER_SECONDS = 60;

const FINISHED_PAST_SHARE = 0.9;

const CREDITS_COUNT_PAST_SHARE = 0.5;

type WatchProgress = z.infer<typeof WatchProgressSchema>;

/**
 * Finds the second from which something counts as watched: nine tenths of the way through, as
 * Jellyfin counts it, or where its credits begin when they are marked and begin sooner.
 *
 * @param durationSeconds - How long it runs, as the library knows it.
 * @param segments - Its marked stretches, of which only credits in its second half count.
 * @returns The second it counts as watched from.
 */
const watchedFrom = (durationSeconds: number, segments: readonly MediaSegment[] = []): number =>
  Math.min(
    durationSeconds * FINISHED_PAST_SHARE,
    ...segments
      .filter(
        (segment) =>
          segment.kind === 'credits' &&
          segment.startSeconds >= durationSeconds * CREDITS_COUNT_PAST_SHARE,
      )
      .map((segment) => segment.startSeconds),
  );

/**
 * Decides whether somebody watched something through: past nine tenths of it, or into its credits
 * where they are marked. Judged against how long the thing really runs, never against how much of a
 * stream has arrived.
 *
 * @param positionSeconds - Where they got to.
 * @param durationSeconds - How long it runs, as the library knows it.
 * @param segments - Its marked stretches, whose credits count as its end.
 * @returns Whether it counts as watched.
 */
const hasWatchedToTheEnd = (
  positionSeconds: number,
  durationSeconds: number,
  segments: readonly MediaSegment[] = [],
): boolean => durationSeconds > 0 && positionSeconds >= watchedFrom(durationSeconds, segments);

/**
 * Decides whether to offer to carry on with something, which is a different question from where it
 * got to. Something barely started was probably opened by accident, and something within the
 * credits has been watched — offering either is offering a viewer their own mistake back.
 *
 * @param progress - Where this viewer got to, and how long the thing is.
 * @returns Whether resuming is worth suggesting.
 */
const isWorthResuming = (progress: WatchProgress): boolean =>
  !progress.isFinished &&
  progress.positionSeconds >= STARTED_AFTER_SECONDS &&
  !hasWatchedToTheEnd(progress.positionSeconds, progress.durationSeconds);

/**
 * Works out how far through something a viewer is, as a fraction between nothing and everything,
 * for the bar drawn across the foot of a card. Something finished reads as all of it, whatever the
 * position it stopped at — it was watched to the credits, which is not the last second. Anything
 * with no duration reads as unwatched rather than as divided by zero.
 *
 * @param progress - Where this viewer got to, and how long the thing is.
 * @returns A fraction from zero to one.
 */
const watchedFraction = (progress: WatchProgress): number => {
  if (progress.isFinished) {
    return 1;
  }

  if (progress.durationSeconds <= 0) {
    return 0;
  }

  return Math.min(Math.max(progress.positionSeconds / progress.durationSeconds, 0), 1);
};

export type { WatchProgress };

export {
  WatchProgressSchema,
  WatchProgressListSchema,
  hasWatchedToTheEnd,
  isWorthResuming,
  watchedFraction,
  STARTED_AFTER_SECONDS,
  FINISHED_PAST_SHARE,
};
