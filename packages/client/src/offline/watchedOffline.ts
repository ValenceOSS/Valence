import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { fetchWatchProgress, reportWatchProgress } from '@ValenceClient/playback/watchProgress';
import { hasWatchedToTheEnd } from '@ValenceContracts/schemas/WatchProgress';

const STORAGE_KEY = 'valence.offline.watched';

const WRITE_EVERY_SECONDS = 5;

const WatchedOfflineSchema = z.object({
  mediaId: z.string(),
  positionSeconds: z.number().nonnegative(),
  durationSeconds: z.number().positive(),
  atMs: z.number().int().nonnegative(),
  server: z.string().nullable().default(null),
  profileId: z.string().nullable().default(null),
});

const WatchedOfflineListSchema = z.array(WatchedOfflineSchema).catch([]);

type WatchedOffline = z.infer<typeof WatchedOfflineSchema>;

/**
 * Everything watched on this device while there was no server to tell.
 *
 * @returns What is waiting to be reconciled, oldest first, for every server and profile.
 */
const everythingWatchedOffline = (): WatchedOffline[] => {
  const said = platformInUse().store.read(STORAGE_KEY);

  if (said === null) {
    return [];
  }

  return WatchedOfflineListSchema.parse(JSON.parse(said));
};

/**
 * Whether an entry was written before entries said which server and profile they were watched on.
 *
 * @param entry - What was watched.
 * @returns Whether it says neither.
 */
const isUnsigned = (entry: WatchedOffline): boolean =>
  entry.server === null && entry.profileId === null;

/**
 * Whether an entry was watched on this server as this profile. One written before entries said
 * whose they were, or watched where nobody could yet say who was watching, belongs to whoever is
 * watching now, which is all that could be told of it then.
 *
 * @param entry - What was watched.
 * @param profileId - Who is watching now.
 * @returns Whether it is theirs, here.
 */
const isTheirsHere = (entry: WatchedOffline, profileId: string | null): boolean =>
  isUnsigned(entry) ||
  (entry.server === platformInUse().serverAddress() &&
    (entry.profileId === profileId || entry.profileId === null));

/**
 * What this profile watched on this device, on this server, while there was no server to tell.
 *
 * @param profileId - Who is watching.
 * @returns What is waiting to be reconciled, oldest first.
 */
const watchedOffline = (profileId: string | null): WatchedOffline[] =>
  everythingWatchedOffline().filter((entry) => isTheirsHere(entry, profileId));

/**
 * Writes down where somebody got to in something, to be told to the server later.
 *
 * Kept on the device because there is nowhere else to keep it. This is the half of offline nobody
 * asks for and everybody notices: watching two episodes on a plane and finding the shelf at home
 * still offering the first one is the moment the feature stops feeling finished.
 *
 * One entry per item, replaced rather than added to. Where somebody got to is the only thing worth
 * keeping; the route they took to get there is not, and keeping it would grow without bound on a
 * long flight.
 *
 * Written no more often than every few seconds. The player reports its position several times a
 * second, and writing each one would mean rewriting a file on the disk hundreds of times per film
 * for a figure nobody will read until the aeroplane lands.
 *
 * Each entry says which server it was watched on and as whom, so it is told to that profile on that
 * server and no other: not to whoever is picked at the next launch, and not to a server that has
 * never heard of it.
 *
 * @param mediaId - What was being watched.
 * @param positionSeconds - Where they got to.
 * @param durationSeconds - How long it runs.
 * @param profileId - Who was watching, where that is known.
 * @param atMs - When, which decides whose answer wins when the server has one too.
 */
const rememberWatchedOffline = (
  mediaId: string,
  positionSeconds: number,
  durationSeconds: number,
  profileId: string | null,
  atMs: number = Date.now(),
): void => {
  if (durationSeconds <= 0) {
    return;
  }

  const server = platformInUse().serverAddress();
  const held = everythingWatchedOffline();
  const isThisOne = (entry: WatchedOffline) =>
    entry.mediaId === mediaId && entry.server === server && entry.profileId === profileId;
  const already = held.find(isThisOne);

  if (
    already !== undefined &&
    Math.abs(already.positionSeconds - positionSeconds) < WRITE_EVERY_SECONDS
  ) {
    return;
  }

  const kept = [
    ...held.filter(
      (entry) =>
        !isThisOne(entry) &&
        !(
          entry.mediaId === mediaId &&
          (isUnsigned(entry) || (entry.server === server && entry.profileId === null))
        ),
    ),
    { mediaId, positionSeconds, durationSeconds, atMs, server, profileId },
  ];

  platformInUse().store.write(STORAGE_KEY, JSON.stringify(kept));
};

/**
 * Forgets what has been watched offline.
 */
const forgetWatchedOffline = (): void => {
  platformInUse().store.forget(STORAGE_KEY);
};

/**
 * Whether two entries are the very same record, read twice.
 *
 * @param one - An entry.
 * @param other - Another.
 * @returns Whether they say the same thing.
 */
const isTheSame = (one: WatchedOffline, other: WatchedOffline): boolean =>
  one.mediaId === other.mediaId &&
  one.server === other.server &&
  one.profileId === other.profileId &&
  one.atMs === other.atMs &&
  one.positionSeconds === other.positionSeconds;

/**
 * Tells the server where somebody got to while it was not there.
 *
 * Watch progress is last written wins, which is not a merge — two devices that watched the same
 * thing while apart disagree, and the loser is silently whichever reconnected first. Offline is what
 * makes that common rather than theoretical, so what is sent is filtered rather than flung: an entry
 * is only sent where the server has nothing, or where what the server has is older than what
 * happened on this device.
 *
 * Deliberately not clever beyond that. Deciding that the furthest position always wins would be
 * wrong for somebody starting a film again, and picking between two honest answers is a question for
 * whoever watched them rather than for this.
 *
 * Everything the server heard is forgotten, including where it already knew better, since anything
 * kept would be sent again on the next reconnection and would overwrite something newer. What it
 * never heard is kept for next time, and nothing is sent at all while it cannot say what it holds.
 * Only what this profile watched on this server is sent, and only the newest of it for each thing
 * watched; what another profile or another server watched is kept for when they are back. What is
 * forgotten afterwards is only what was sent, superseded or already known better, read again from
 * the device once the server has answered, so anything watched while it was asked is kept.
 *
 * @param profileId - Who is watching now, or null where that is not yet known, which sends nothing.
 * @returns How many were told to the server.
 */
const sendWatchedOffline = async (profileId: string | null): Promise<number> => {
  const held =
    profileId === null
      ? []
      : everythingWatchedOffline().filter((entry) => isTheirsHere(entry, profileId));

  if (held.length === 0) {
    return 0;
  }

  const answered = await fetchWatchProgress().catch(() => null);

  if (answered === null) {
    return 0;
  }

  const known = new Map(answered.map((entry) => [entry.mediaId, Date.parse(entry.updatedAt)]));
  const newest = new Map<string, WatchedOffline>();

  for (const entry of held) {
    const kept = newest.get(entry.mediaId);

    if (kept === undefined || entry.atMs > kept.atMs) {
      newest.set(entry.mediaId, entry);
    }
  }

  const worthSending = [...newest.values()].filter((entry) => {
    const theirs = known.get(entry.mediaId);

    return theirs === undefined || Number.isNaN(theirs) || entry.atMs > theirs;
  });

  const heard = await Promise.all(
    worthSending.map(async (entry) =>
      reportWatchProgress(entry.mediaId, {
        positionSeconds: entry.positionSeconds,
        durationSeconds: entry.durationSeconds,
        isFinished: hasWatchedToTheEnd(entry.positionSeconds, entry.durationSeconds),
      }),
    ),
  );
  const unheard = worthSending.filter((_, index) => heard[index] !== true);
  const settled = held.filter((entry) => !unheard.includes(entry));
  const left = everythingWatchedOffline().filter(
    (entry) => !settled.some((done) => isTheSame(done, entry)),
  );

  if (left.length === 0) {
    forgetWatchedOffline();
  } else {
    platformInUse().store.write(STORAGE_KEY, JSON.stringify(left));
  }

  return worthSending.length - unheard.length;
};

export type { WatchedOffline };

export { forgetWatchedOffline, rememberWatchedOffline, sendWatchedOffline, watchedOffline };
