import { mapWithLimit } from '@ValenceCore/functions/mapWithLimit';
import type { Watched } from '@ValenceServer/sources/createTroubleWatch';
import type { SourceTrouble } from '@ValenceServer/sources/SourceTrouble';
import type { CatalogueTitle, LikenessStore } from './createDatabaseLikenessStore';
import type { Likeness } from './Likeness';

type LikenessReading = {
  store: Pick<LikenessStore, 'waiting' | 'keep' | 'forgetUnheld'>;
  read: (title: CatalogueTitle) => Promise<Watched<Likeness | null>>;
  onProgress: (done: number, total: number) => void;
  isCancelled: () => boolean;
  now: () => Date;
};

type LikenessRead = { read: number; trouble: SourceTrouble | null };

const READ_AGAIN_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

const AT_ONCE = 4;

const NOTHING_ALIKE: Likeness = {
  genres: [],
  keywords: [],
  cast: [],
  crew: [],
  recommendations: [],
};

/**
 * Asks the catalogue what each title in the libraries is like, for every one never asked about or
 * not for a month, and forgets the titles no library holds any longer. A title the catalogue does
 * not know is kept as alike to nothing, so it is not asked about again until the month is out. A
 * failing catalogue, or no key to ask it with, stops the run, as does a request that fails outright,
 * and what it had not reached waits for the next one.
 *
 * @param reading - Where the titles are kept, how to ask about one, and what to tell along the way.
 * @returns How many were read, and what stopped the run where something did.
 */
const readWaitingLikeness = async ({
  store,
  read,
  onProgress,
  isCancelled,
  now,
}: LikenessReading): Promise<LikenessRead> => {
  await store.forgetUnheld();

  const waiting = await store.waiting(new Date(now().getTime() - READ_AGAIN_AFTER_MS));
  let done = 0;
  let stoppedBy: SourceTrouble | null = null;

  onProgress(done, waiting.length);

  await mapWithLimit(waiting, AT_ONCE, async (title) => {
    if (stoppedBy !== null || isCancelled()) {
      return;
    }

    const { value: likeness, trouble } = await read(title).catch(() => ({
      value: null,
      trouble: { source: 'catalogue', reason: 'unreachable' } as const,
    }));

    if (trouble !== null) {
      stoppedBy ??= trouble;

      return;
    }

    await store.keep(title, likeness ?? NOTHING_ALIKE, now());
    done += 1;
    onProgress(done, waiting.length);
  });

  return { read: done, trouble: stoppedBy };
};

export type { LikenessReading };

export { READ_AGAIN_AFTER_MS, readWaitingLikeness };
