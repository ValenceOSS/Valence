import type { KeyframesAhead } from '@ValenceServer/transcoder/TranscoderClient';

type WaitingFilm = { id: string; path: string };

type KeyframesAheadReading = {
  waiting: () => Promise<WaitingFilm[]>;
  readAhead: (path: string, signal: AbortSignal) => Promise<KeyframesAhead>;
  markRead: (id: string) => Promise<void>;
  onUnreadable: (path: string) => void;
  onFailed?: (path: string, failure: Error) => void;
  onProgress: (done: number, total: number) => void;
  isCancelled: () => boolean;
};

const FAILURES_IN_A_ROW = 3;

const CANCEL_CHECK_MILLISECONDS = 1000;

type KeyframesReadAhead = {
  read: number;
  kept: number;
  skipped: number;
  unreadable: number;
  isHeldBack: boolean;
};

/**
 * Reads one film's keyframes, given up on the moment the job is cancelled: the request is abandoned,
 * which the media service takes as the work being dropped, ffmpeg and all.
 *
 * @param readAhead - How one film is read.
 * @param path - The film.
 * @param isCancelled - Whether the job has been cancelled.
 * @returns What became of it.
 */
const readUnlessCancelled = async (
  readAhead: KeyframesAheadReading['readAhead'],
  path: string,
  isCancelled: () => boolean,
): Promise<KeyframesAhead> => {
  const abandon = new AbortController();
  const watching = setInterval(() => {
    if (isCancelled()) {
      abandon.abort();
    }
  }, CANCEL_CHECK_MILLISECONDS);

  try {
    return await readAhead(path, abandon.signal);
  } finally {
    clearInterval(watching);
  }
};

/**
 * Reads where each waiting film and episode can be cut, ahead of anybody playing it, one at a
 * time and newest first, since the newest is the likeliest to be played next. A film the media
 * service says is read, already kept, has nothing to read or cannot be read is marked so it is not
 * asked about again until it changes. Somebody watching stops the work where it is, and everything
 * after waits for the next run. A film whose read fails is passed over, marked nothing, since that
 * says nothing about the film, and the rest are read; a few failing in a row say the media service
 * is not answering, and the run stops there. Cancelling stops the film being read at once.
 *
 * @param reading - What is waiting, how one film is read, where it is marked, and where progress,
 *   unreadable films and failed reads are told.
 * @returns How many films were read, already kept, skipped and unreadable, and whether somebody
 *   watching held the rest back.
 */
const readKeyframesAhead = async ({
  waiting,
  readAhead,
  markRead,
  onUnreadable,
  onProgress,
  onFailed,
  isCancelled,
}: KeyframesAheadReading): Promise<KeyframesReadAhead> => {
  const films = await waiting();
  const outcome: KeyframesReadAhead = {
    read: 0,
    kept: 0,
    skipped: 0,
    unreadable: 0,
    isHeldBack: false,
  };

  let failedInARow = 0;

  onProgress(0, films.length);

  for (const [done, film] of films.entries()) {
    if (isCancelled()) {
      break;
    }

    let state: KeyframesAhead;

    try {
      state = await readUnlessCancelled(readAhead, film.path, isCancelled);
    } catch (error) {
      if (isCancelled()) {
        break;
      }

      failedInARow += 1;

      if (failedInARow >= FAILURES_IN_A_ROW) {
        throw error;
      }

      onFailed?.(film.path, error instanceof Error ? error : new Error(String(error)));
      onProgress(done + 1, films.length);

      continue;
    }

    failedInARow = 0;

    if (state === 'later') {
      outcome.isHeldBack = true;

      break;
    }

    if (state === 'unreadable') {
      onUnreadable(film.path);
    }

    outcome[state] += 1;
    await markRead(film.id);
    onProgress(done + 1, films.length);
  }

  return outcome;
};

export type { KeyframesAheadReading, KeyframesReadAhead, WaitingFilm };

export { readKeyframesAhead };
