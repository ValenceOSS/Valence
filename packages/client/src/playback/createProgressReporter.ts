import { reportWatchProgress } from '@ValenceClient/playback/watchProgress';
import { hasWatchedToTheEnd } from '@ValenceContracts/schemas/WatchProgress';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';

type ProgressSample = {
  positionSeconds: number;
  durationSeconds: number;
  segments?: readonly MediaSegment[];
};

type ProgressReporter = {
  report: (sample: ProgressSample, options?: { isLeaving?: boolean }) => Promise<boolean>;
};

const MOVED_AT_LEAST_SECONDS = 1;

/**
 * Makes the one thing a player tells the server where its viewer got to through, which sends only a
 * position that has moved since the last one it sent, so a player left paused on one screen never
 * writes over what the viewer went on to watch on another. Each report settles with whether the server
 * heard something new, at once where there was nothing new to say.
 *
 * @param mediaId - The item being watched.
 * @param keepsAbove - Where the viewer is known to have got to before this player started, where it
 *   started without knowing: nothing short of it is reported until they pass it, so a player that
 *   began at the top before the saved place had arrived never writes over that place.
 * @returns The reporter.
 */
const createProgressReporter = (
  mediaId: string,
  keepsAbove: () => number | null = () => null,
): ProgressReporter => {
  let sent: number | null = null;
  let hasPassedWhatWasSaved = false;

  return {
    report: ({ positionSeconds, durationSeconds, segments = [] }, { isLeaving = false } = {}) => {
      if (
        !Number.isFinite(positionSeconds) ||
        positionSeconds <= 0 ||
        !Number.isFinite(durationSeconds) ||
        durationSeconds <= 0
      ) {
        return Promise.resolve(false);
      }

      if (sent !== null && Math.abs(positionSeconds - sent) < MOVED_AT_LEAST_SECONDS) {
        return Promise.resolve(false);
      }

      const saved = hasPassedWhatWasSaved ? null : keepsAbove();

      if (saved !== null && positionSeconds < saved) {
        return Promise.resolve(false);
      }

      hasPassedWhatWasSaved = hasPassedWhatWasSaved || saved !== null;

      sent = positionSeconds;

      return reportWatchProgress(
        mediaId,
        {
          positionSeconds,
          durationSeconds,
          isFinished: hasWatchedToTheEnd(positionSeconds, durationSeconds, segments),
        },
        { isLeaving },
      );
    },
  };
};

export type { ProgressReporter, ProgressSample };

export { createProgressReporter };
