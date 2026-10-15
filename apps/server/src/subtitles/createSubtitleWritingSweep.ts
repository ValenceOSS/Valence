const MOST_A_ROUND = 20;

type SubtitleWritingSweepOptions = {
  newest: () => Promise<string[]>;
  isOn: () => Promise<boolean>;
  hasOwnSubtitles: (mediaId: string) => Promise<boolean>;
  write: (mediaId: string) => Promise<boolean>;
};

type SubtitleWritingSweep = {
  run: (onProgress: (done: number, total: number) => void) => Promise<number>;
};

/**
 * Has Whisper write subtitles for the newest films and episodes that have none, a few a round, so a
 * library is covered over a few nights rather than the media service listening to all of it at
 * once. A title already written, or with subtitles of its own in the file, is passed over.
 *
 * @param options - The newest films and episodes, whether writing is on, whether a title carries subtitles in the
 *   file, and the way to start writing for one, which says whether it is still to be written.
 * @returns A way to run a round.
 */
const createSubtitleWritingSweep = ({
  newest: readNewest,
  isOn,
  hasOwnSubtitles,
  write,
}: SubtitleWritingSweepOptions): SubtitleWritingSweep => ({
  run: async (onProgress) => {
    if (!(await isOn())) {
      return 0;
    }

    const newest = await readNewest();
    let started = 0;

    for (const [at, id] of newest.entries()) {
      if (started >= MOST_A_ROUND) {
        break;
      }

      onProgress(at, newest.length);

      if (!(await hasOwnSubtitles(id)) && (await write(id))) {
        started += 1;
      }
    }

    onProgress(newest.length, newest.length);

    return started;
  },
});

export type { SubtitleWritingSweep };

export { createSubtitleWritingSweep };
