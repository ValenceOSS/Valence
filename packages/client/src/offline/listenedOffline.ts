import { z } from 'zod';
import { fetchListeningProgress, saveListeningProgress } from '@ValenceClient/books/fetchListening';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { ListeningPlace } from '@ValenceClient/books/createAudiobookPlayer';

const STORAGE_KEY = 'valence.offline.listened';

const ListenedOfflineSchema = z.object({
  bookId: z.string(),
  chapterId: z.string(),
  positionSeconds: z.number().nonnegative(),
  isFinished: z.boolean(),
  server: z.string().nullable(),
  atMs: z.number().int().nonnegative().default(0),
});

const ListenedOfflineListSchema = z.array(ListenedOfflineSchema).catch([]);

type ListenedOffline = z.infer<typeof ListenedOfflineSchema>;

/**
 * Everything listened to on this device while the server could not be told.
 *
 * @returns Where each book got to, for every server.
 */
const everythingListenedOffline = (): ListenedOffline[] => {
  try {
    return ListenedOfflineListSchema.parse(
      JSON.parse(platformInUse().store.read(STORAGE_KEY) ?? '[]'),
    );
  } catch {
    return [];
  }
};

/**
 * Writes down what is still to be told, or forgets the lot where nothing is.
 *
 * @param left - What is still to be told.
 */
const keep = (left: ListenedOffline[]): void => {
  if (left.length === 0) {
    platformInUse().store.forget(STORAGE_KEY);
  } else {
    platformInUse().store.write(STORAGE_KEY, JSON.stringify(left));
  }
};

/**
 * Writes down where somebody got to in an audiobook the server could not be told about, one place
 * a book, to be told when it can.
 *
 * @param bookId - The book.
 * @param place - Where they got to.
 */
const rememberListenedOffline = (
  bookId: string,
  place: ListeningPlace,
  atMs: number = Date.now(),
): void => {
  const server = platformInUse().serverAddress();

  keep([
    ...everythingListenedOffline().filter(
      (entry) => entry.bookId !== bookId || entry.server !== server,
    ),
    { bookId, ...place, server, atMs },
  ]);
};

/**
 * Forgets where somebody got to in an audiobook offline, once the server has been told something
 * newer.
 *
 * @param bookId - The book.
 */
const forgetListenedOffline = (bookId: string): void => {
  const server = platformInUse().serverAddress();

  keep(
    everythingListenedOffline().filter(
      (entry) => entry.bookId !== bookId || entry.server !== server,
    ),
  );
};

/**
 * Where somebody got to in an audiobook on this device and this server while it was offline.
 *
 * @param bookId - The book.
 * @returns Where they got to, or nothing.
 */
const listenedOffline = (bookId: string): ListeningPlace | null => {
  const server = platformInUse().serverAddress();
  const found = everythingListenedOffline().find(
    (entry) => entry.bookId === bookId && entry.server === server,
  );

  return found === undefined
    ? null
    : {
        chapterId: found.chapterId,
        positionSeconds: found.positionSeconds,
        isFinished: found.isFinished,
      };
};

/**
 * Tells the server in use where every audiobook listened to offline got to, unless it has heard of
 * somewhere newer since, and forgets each one that is settled.
 *
 * @returns How many it told.
 */
const sendListenedOffline = async (): Promise<number> => {
  const server = platformInUse().serverAddress();
  const here = everythingListenedOffline().filter((entry) => entry.server === server);
  const outcomes = await Promise.all(
    here.map(async (entry) => {
      const known = await fetchListeningProgress(entry.bookId).catch(() => undefined);

      if (known === undefined) {
        return 'unsettled';
      }

      if (known !== null && Date.parse(known.updatedAt) >= entry.atMs) {
        return 'stale';
      }

      const isHeard = await saveListeningProgress(entry.bookId, {
        chapterId: entry.chapterId,
        positionSeconds: entry.positionSeconds,
        isFinished: entry.isFinished,
      });

      return isHeard ? 'told' : 'unsettled';
    }),
  );
  const settled = here.filter((_, at) => outcomes[at] !== 'unsettled');

  keep(
    everythingListenedOffline().filter(
      (entry) =>
        !settled.some(
          (done) =>
            done.bookId === entry.bookId &&
            done.server === entry.server &&
            done.atMs === entry.atMs,
        ),
    ),
  );

  return outcomes.filter((outcome) => outcome === 'told').length;
};

export { forgetListenedOffline, listenedOffline, rememberListenedOffline, sendListenedOffline };
