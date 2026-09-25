import { say } from '@ValenceI18n/say';
import type { FollowedDownload } from './DownloadService';

const EVERY_MS = 3000;

type FollowTheDownloadsOptions = {
  follow: () => Promise<FollowedDownload[]>;
  onFollowed: (followed: FollowedDownload[]) => void | Promise<void>;
  onProblem?: (reason: string) => void;
  everyMs?: number;
};

/**
 * Keeps an eye on every file being prepared, so how far each has got, and when each is ready, is
 * known whether or not anybody is looking.
 *
 * One round at a time and never two at once: a round waits on the media service for every file
 * still being prepared, and on a slow machine that can take longer than the gap between rounds.
 * A round that fails is reported and the next goes ahead as though it had not.
 *
 * @param options - What to ask each round, what to do with what changed, and how often.
 * @returns What stops it.
 */
const followTheDownloads = ({
  follow,
  onFollowed,
  onProblem,
  everyMs = EVERY_MS,
}: FollowTheDownloadsOptions): (() => void) => {
  let isStopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  /** Runs one round, then books the next once it has finished. */
  const round = async (): Promise<void> => {
    try {
      const followed = await follow();

      if (followed.length > 0) {
        await onFollowed(followed);
      }
    } catch (problem) {
      onProblem?.(
        problem instanceof Error ? problem.message : say('server.issues.downloadsNotFollowed'),
      );
    } finally {
      if (!isStopped) {
        timer = setTimeout(() => {
          void round();
        }, everyMs);
      }
    }
  };

  timer = setTimeout(() => {
    void round();
  }, everyMs);

  return () => {
    isStopped = true;

    if (timer !== null) {
      clearTimeout(timer);
    }
  };
};

export { followTheDownloads };
