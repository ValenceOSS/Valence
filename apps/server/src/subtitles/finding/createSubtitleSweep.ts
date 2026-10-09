import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { library, mediaItem } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { FetchedSubtitleStore } from './createFetchedSubtitleStore';
import type { SubtitleFinder } from './SubtitleFinder';

const MOST_A_ROUND = 40;

const NEWEST_CONSIDERED = 400;

const LOOKS_AGAIN_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

type SubtitleSweepOptions = {
  db: AnyValenceDatabase;
  finder: SubtitleFinder;
  store: FetchedSubtitleStore;
  ownLanguages: (mediaId: string) => Promise<string[]>;
  now?: () => number;
};

type SubtitleSweep = {
  arrived: (mediaId: string) => void;
  run: (onProgress: (done: number, total: number) => void) => Promise<number>;
};

/**
 * Looks for subtitles on its own, a few files a round: first whatever a scan just brought in, and
 * otherwise the newest films and episodes not looked at for a week, so a subtitle that turns up
 * later, or a better one, is found in time without asking the subtitle sites about the whole
 * library every night or spending the day's downloads at once.
 *
 * @param options - The database, the finder and its store, how to tell which languages a file
 *   already has subtitles in of its own, and the clock.
 * @returns A way to note a file that arrived, and to run a round.
 */
const createSubtitleSweep = ({
  db,
  finder,
  store,
  ownLanguages,
  now = () => Date.now(),
}: SubtitleSweepOptions): SubtitleSweep => {
  const waiting = new Set<string>();

  const due = async (): Promise<string[]> => {
    if (waiting.size > 0) {
      const taken = [...waiting].slice(0, MOST_A_ROUND);

      for (const id of taken) {
        waiting.delete(id);
      }

      return taken;
    }

    const newest = await db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(and(inArray(library.kind, ['movies', 'shows']), isNull(mediaItem.extraKind)))
      .orderBy(desc(mediaItem.addedAt))
      .limit(NEWEST_CONSIDERED);
    const picked: string[] = [];

    for (const { id } of newest) {
      const checked = await store.checkedAt(id);

      if (checked === null || now() - checked.getTime() > LOOKS_AGAIN_AFTER_MS) {
        picked.push(id);
      }

      if (picked.length >= MOST_A_ROUND) {
        break;
      }
    }

    return picked;
  };

  return {
    arrived: (mediaId) => {
      waiting.add(mediaId);
    },

    run: async (onProgress) => {
      if ((await finder.setup()).isAutomatic === false) {
        return 0;
      }

      const ids = await due();
      let fetched = 0;

      for (const [at, id] of ids.entries()) {
        onProgress(at, ids.length);

        const looked = await finder.fetchWanted(id, await ownLanguages(id));

        if (looked.kind === 'off') {
          break;
        }

        fetched += looked.kind === 'looked' ? looked.added + looked.upgraded : 0;
      }

      onProgress(ids.length, ids.length);

      return fetched;
    },
  };
};

export type { SubtitleSweep };

export { createSubtitleSweep };
