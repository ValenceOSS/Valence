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
  profileId: z.string().nullable().default(null),
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
 * Whether a place was kept on this server as this profile. One kept before places said whose they
 * were, or where nobody could say who was listening, belongs to whoever is listening now, which is
 * all that could be told of it then.
 *
 * @param entry - The place kept.
 * @param profileId - Who is listening now.
 * @returns Whether it is theirs, here.
 */
const isTheirsHere = (entry: ListenedOffline, profileId: string | null): boolean =>
  entry.server === platformInUse().serverAddress() &&
  (entry.profileId === null || entry.profileId === profileId);

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
 * @param atMs - When they got there.
 * @param profileId - Who was listening, where that is known.
 */
const rememberListenedOffline = (
  bookId: string,
  place: ListeningPlace,
  atMs: number = Date.now(),
  profileId: string | null = null,
): void => {
  const server = platformInUse().serverAddress();

  keep([
    ...everythingListenedOffline().filter(
      (entry) =>
        entry.bookId !== bookId ||
        entry.server !== server ||
        (entry.profileId !== null && entry.profileId !== profileId),
    ),
    { bookId, ...place, server, atMs, profileId },
  ]);
};

/**
 * Forgets where somebody got to in an audiobook offline, once the server has been told something
 * newer.
 *
 * @param bookId - The book.
 * @param profileId - Who the server was told about.
 */
const forgetListenedOffline = (bookId: string, profileId: string | null = null): void => {
  keep(
    everythingListenedOffline().filter(
      (entry) => entry.bookId !== bookId || !isTheirsHere(entry, profileId),
    ),
  );
};

/**
 * Where somebody got to in an audiobook on this device and this server while it was offline.
 *
 * @param bookId - The book.
 * @param profileId - Who is listening.
 * @returns Where they got to, or nothing.
 */
const listenedOffline = (
  bookId: string,
  profileId: string | null = null,
): ListeningPlace | null => {
  const found = everythingListenedOffline().find(
    (entry) => entry.bookId === bookId && isTheirsHere(entry, profileId),
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
 * Tells the server in use where every audiobook this profile listened to offline got to, unless it
 * has heard of somewhere newer since, and forgets each one that is settled. What another profile
 * listened to is kept for when they are back.
 *
 * @param profileId - Who is listening now, or null where that is not yet known, which sends nothing.
 * @returns How many it told.
 */
const sendListenedOffline = async (profileId: string | null): Promise<number> => {
  const here =
    profileId === null
      ? []
      : everythingListenedOffline().filter((entry) => isTheirsHere(entry, profileId));
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
            done.profileId === entry.profileId &&
            done.atMs === entry.atMs,
        ),
    ),
  );

  return outcomes.filter((outcome) => outcome === 'told').length;
};

export { forgetListenedOffline, listenedOffline, rememberListenedOffline, sendListenedOffline };
