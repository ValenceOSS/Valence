import { KeptListeningShelfSchema } from '@ValenceContracts/schemas/KeptListening';
import type {
  KeptListening,
  KeptListeningFile,
  KeptListeningKind,
  KeptListeningShelf,
} from '@ValenceContracts/schemas/KeptListening';
import type { DeviceStore, ListeningFiles } from '@ValenceClient/platform/Platform.types';
import {
  filesOfKeptListening,
  keptArtworkName,
  keptChapterPrefix,
  keptTrackPrefix,
} from '@ValenceClient/downloads/filesOfKeptListening';
import { say } from '@ValenceI18n/say';

const SHELF = 'valence.kept.listening';

const TELL_PROGRESS_AT_MOST_EVERY = 1000;

type KeptListeningNeeds = {
  store: DeviceStore;
  files: ListeningFiles;
  server: () => string | null;
  now: () => number;
};

type KeptListeningShelfKeeper = {
  shelf: () => KeptListeningShelf;
  keep: (what: KeptListening) => Promise<void>;
  drop: (kind: KeptListeningKind, id: string) => Promise<void>;
  pause: (kind: KeptListeningKind, id: string, isPaused: boolean) => Promise<void>;
  carryOn: () => void;
  trackAddress: (trackId: string) => string | null;
  chapterAddress: (chapterId: string) => string | null;
  artworkAddress: (kind: KeptListeningKind, id: string) => string | null;
  whenChanged: (listener: (shelf: KeptListeningShelf) => void) => () => void;
};

/**
 * Whether two kept things are the same one.
 *
 * @param one - What is kept.
 * @param kind - What kind the other is.
 * @param id - Which it is.
 * @returns Whether they are the same.
 */
const isThe = (one: Pick<KeptListening, 'kind' | 'id'>, kind: KeptListeningKind, id: string) =>
  one.kind === kind && one.id === id;

/**
 * Reads the shelf written down, as an empty one where what was written is not a shelf at all.
 *
 * @param text - What the store held.
 * @returns The shelf.
 */
const readShelf = (text: string | null): KeptListeningShelf => {
  try {
    const read = KeptListeningShelfSchema.safeParse(JSON.parse(text ?? '{}'));

    return read.success ? read.data : { kept: [], files: [] };
  } catch {
    return { kept: [], files: [] };
  }
};

/**
 * The music and audiobooks a device keeps to listen to without the server, and the files they are
 * kept as: each file fetched in turn, picked up again after the app closes, shared between an album
 * and a playlist that both hold a song, and taken off the device once nothing kept holds it.
 *
 * @param needs - Where the list is kept, where files go, which server is in use, and the time.
 * @returns What keeps them.
 */
const createKeptListening = (needs: KeptListeningNeeds): KeptListeningShelfKeeper => {
  let shelf = readShelf(needs.store.read(SHELF));
  const listeners = new Set<(shelf: KeptListeningShelf) => void>();
  let fetching: string | null = null;
  let lastTold = 0;

  const save = (isForced = true) => {
    const now = needs.now();

    if (!isForced && now - lastTold < TELL_PROGRESS_AT_MOST_EVERY) {
      return;
    }

    lastTold = now;
    needs.store.write(SHELF, JSON.stringify(shelf));

    for (const listener of listeners) {
      listener(shelf);
    }
  };

  const change = (name: string, to: Partial<KeptListeningFile>, isForced = true) => {
    shelf = {
      ...shelf,
      files: shelf.files.map((file) => (file.name === name ? { ...file, ...to } : file)),
    };
    save(isForced);
  };

  const isHere = (kept: KeptListening) => kept.server === null || kept.server === needs.server();

  const namesOf = (kept: KeptListening) =>
    new Set(filesOfKeptListening(kept, needs.files.canPlay).map((file) => file.name));

  const wanted = () => new Set(shelf.kept.filter(isHere).flatMap((kept) => [...namesOf(kept)]));

  const fetchNext = async (): Promise<void> => {
    if (fetching !== null) {
      return;
    }

    const stillWanted = wanted();
    const next = shelf.files.find(
      (file) => file.state === 'fetching' && stillWanted.has(file.name),
    );

    if (next === undefined) {
      return;
    }

    fetching = next.name;

    const fetched = await needs.files
      .fetch(next.from, next.name, (bytes, ofBytes) => {
        change(next.name, { bytes, ...(ofBytes === null ? {} : { ofBytes }) }, false);
      })
      .catch(() => ({
        bytes: 0,
        isComplete: false,
        failure: say('common.downloadFailed'),
      }));

    fetching = null;

    const now = shelf.files.find((file) => file.name === next.name);

    if (now !== undefined && now.state === 'fetching') {
      change(
        next.name,
        fetched.isComplete
          ? { state: 'here', bytes: fetched.bytes, ofBytes: fetched.bytes, failure: null }
          : fetched.failure === null
            ? { state: 'paused', bytes: fetched.bytes }
            : { state: 'failed', bytes: fetched.bytes, failure: fetched.failure },
      );
    }

    await fetchNext();
  };

  const letGoOfWhatNothingHolds = async () => {
    const held = new Set(shelf.kept.flatMap((kept) => [...namesOf(kept)]));
    const unheld = shelf.files.filter((file) => !held.has(file.name));

    if (unheld.length === 0) {
      return;
    }

    shelf = { ...shelf, files: shelf.files.filter((file) => held.has(file.name)) };
    save();

    for (const file of unheld) {
      if (fetching === file.name) {
        await needs.files.stop(file.name).catch(() => undefined);
      }

      await needs.files.drop(file.name).catch(() => undefined);
    }
  };

  const addressWhere = (startsWith: string): string | null => {
    const file = shelf.files.find((one) => one.state === 'here' && one.name.startsWith(startsWith));

    return file === undefined ? null : needs.files.addressOf(file.name);
  };

  return {
    shelf: () => shelf,

    keep: async (what) => {
      const files = filesOfKeptListening(what, needs.files.canPlay);
      const known = new Set(shelf.files.map((file) => file.name));

      shelf = {
        kept: [what, ...shelf.kept.filter((kept) => !isThe(kept, what.kind, what.id))],
        files: [
          ...shelf.files.map((file) =>
            files.some((one) => one.name === file.name) && file.state !== 'here'
              ? { ...file, state: 'fetching' as const, failure: null }
              : file,
          ),
          ...files
            .filter((file) => !known.has(file.name))
            .map((file) => ({
              ...file,
              state: 'fetching' as const,
              bytes: 0,
              ofBytes: null,
              failure: null,
            })),
        ],
      };
      save();
      await letGoOfWhatNothingHolds();
      void fetchNext();
    },

    drop: async (kind, id) => {
      shelf = { ...shelf, kept: shelf.kept.filter((kept) => !isThe(kept, kind, id)) };
      save();
      await letGoOfWhatNothingHolds();
      void fetchNext();
    },

    pause: async (kind, id, isPaused) => {
      const kept = shelf.kept.find((one) => isThe(one, kind, id));

      if (kept === undefined) {
        return;
      }

      const own = namesOf(kept);
      const stillWanted = new Set(
        shelf.kept
          .filter((one) => !isThe(one, kind, id))
          .map((one) => namesOf(one))
          .filter((theirs) =>
            shelf.files.some(
              (file) => file.state === 'fetching' && theirs.has(file.name) && !own.has(file.name),
            ),
          )
          .flatMap((theirs) => [...theirs]),
      );
      const names = new Set([...own].filter((name) => !isPaused || !stillWanted.has(name)));

      shelf = {
        ...shelf,
        files: shelf.files.map((file) =>
          names.has(file.name) && file.state !== 'here'
            ? {
                ...file,
                state: isPaused ? ('paused' as const) : ('fetching' as const),
                failure: null,
              }
            : file,
        ),
      };
      save();

      if (isPaused && fetching !== null && names.has(fetching)) {
        await needs.files.stop(fetching).catch(() => undefined);
      }

      void fetchNext();
    },

    carryOn: () => {
      void fetchNext();
    },

    trackAddress: (trackId) => addressWhere(keptTrackPrefix(trackId)),

    chapterAddress: (chapterId) => addressWhere(keptChapterPrefix(chapterId)),

    artworkAddress: (kind, id) => addressWhere(keptArtworkName({ kind, id })),

    whenChanged: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export type { KeptListeningNeeds, KeptListeningShelfKeeper };

export { createKeptListening };
