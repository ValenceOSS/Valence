import type { KeyframesAhead } from '@ValenceServer/transcoder/TranscoderClient';

type WaitingFilm = { id: string; path: string };

type KeyframesAheadReading = {
  waiting: () => Promise<WaitingFilm[]>;
  readAhead: (path: string) => Promise<KeyframesAhead>;
  markRead: (id: string) => Promise<void>;
  onUnreadable: (path: string) => void;
  onProgress: (done: number, total: number) => void;
  isCancelled: () => boolean;
};

type KeyframesReadAhead = {
  read: number;
  kept: number;
  skipped: number;
  unreadable: number;
  isHeldBack: boolean;
};

/**
 * Reads where each waiting film and episode can be cut, ahead of anybody playing it, one at a
 * time and newest first, since the newest is the likeliest to be played next. A film the media
 * service says is read, already kept, has nothing to read or cannot be read is marked so it is not
 * asked about again until it changes. Somebody watching stops the work where it is, and everything
 * after waits for the next run; so does the media service not answering, which marks nothing,
 * since that says nothing about the film.
 *
 * @param reading - What is waiting, how one film is read, where it is marked, and where progress
 *   and unreadable films are told.
 * @returns How many films were read, already kept, skipped and unreadable, and whether somebody
 *   watching held the rest back.
 */
const readKeyframesAhead = async ({
  waiting,
  readAhead,
  markRead,
  onUnreadable,
  onProgress,
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

  onProgress(0, films.length);

  for (const [done, film] of films.entries()) {
    if (isCancelled()) {
      break;
    }

    const state = await readAhead(film.path);

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
