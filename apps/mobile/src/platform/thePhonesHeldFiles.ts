import {
  createDownloadResumable,
  deleteAsync,
  documentDirectory,
  downloadAsync,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import { AppState } from 'react-native';
import { HeldFileListSchema } from '@ValenceContracts/schemas/HeldFile';
import { KEPT_TRICKPLAY_INDEX } from '@ValenceClient/downloads/KEPT_TRICKPLAY_INDEX';
import { keptTrickplayFrom } from '@ValenceClient/downloads/keptTrickplayFrom';
import { trickplayToKeep } from '@ValenceClient/downloads/trickplayToKeep';
import { HELD_RESUMES } from '@ValenceMobile/platform/HELD_RESUMES';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import type { DownloadResumable } from 'expo-file-system/legacy';
import type { DeviceStore, HeldFiles } from '@ValenceClient/platform/Platform.types';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import { say } from '@ValenceI18n/say';

const INDEX = 'valence.held';

const FOLDER = `${documentDirectory ?? ''}held/`;

const SAVE_PROGRESS_AT_MOST_EVERY = 1000;

/**
 * Where a kept film is, on this phone.
 *
 * @param downloadId - The prepared download it came from.
 * @returns Its address, as a player reads a file.
 */
const filmOf = (downloadId: string): string => `${FOLDER}${downloadId}.mp4`;

/**
 * Where a kept film's poster is, on this phone.
 *
 * @param downloadId - The prepared download it came from.
 * @returns Its address, as an image reads a file.
 */
const posterOf = (downloadId: string): string => `${FOLDER}${downloadId}.jpg`;

/**
 * Where a kept film's scrubbing thumbnails are, on this phone: a folder of their own beside it.
 *
 * @param downloadId - The prepared download it came from.
 * @returns The folder's address, ending in a slash.
 */
const trickplayOf = (downloadId: string): string => `${FOLDER}${downloadId}.trickplay/`;

/**
 * Asks this phone's server something, given a path on it, as the rest of the application does: the
 * session travels in the phone's own cookie jar, which a cookie set by hand on a request would get
 * in the way of.
 *
 * @param path - Where on the server.
 * @param how - The rest of the request.
 * @returns The answer.
 */
const askTheServer = (path: string, how: RequestInit = {}): Promise<Response> =>
  fetch(onThisServer(path), how);

/**
 * The files this phone keeps for watching without the server, as the desktop keeps them: each
 * fetched from what the server prepared, with its poster and its scrubbing thumbnails beside it, and
 * a list of them kept in the phone's store so they are known again after the app has closed.
 * Thumbnails the server had not made yet when a film arrived are asked for again once the app has
 * started.
 *
 * A fetch can be paused and picked up again, and one the app closed partway through is picked up
 * where it stopped once the app has started. Each carries this phone's session, which the server
 * asks for before it hands a file over. How far a fetch has got is written down and told about at
 * most once a second, and every change of state at once.
 *
 * Where to pick a fetch up from is only given by stopping it, so each one running is stopped and
 * carried straight on whenever the app goes to the background, which is when it may be closed, and
 * a fetch that fails partway keeps where it got to. Before, only a pause kept it, and a phone that
 * closed the app partway through a film of several gigabytes fetched it again from the start. A
 * fetch that failed is tried again the way a paused one carries on.
 *
 * @param store - Where the list of them is kept.
 * @param readAside - Reads what a paused fetch left to pick up from, which is kept out of the store.
 * @param whenSettled - Runs what was left fetching once the app has started.
 * @param whenLeaving - Runs something whenever the app goes to the background.
 * @returns What the platform keeps files through.
 */
const thePhonesHeldFiles = (
  store: DeviceStore,
  readAside: (key: string) => Promise<string | null> = (key) => Promise.resolve(store.read(key)),
  whenSettled: (run: () => void) => void = (run) => {
    run();
  },
  whenLeaving: (run: () => void) => void = (run) => {
    AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        run();
      }
    });
  },
): HeldFiles => {
  const read = HeldFileListSchema.safeParse(JSON.parse(store.read(INDEX) ?? '{"held":[]}'));
  let rows: HeldFile[] = read.success ? read.data.held : [];
  const transfers = new Map<string, DownloadResumable>();
  const listeners = new Set<(held: HeldFile[]) => void>();
  const alreadyStarted = new Set<string>();
  const runs = new Map<string, number>();
  let lastSaved = 0;

  const save = (isForced = true) => {
    const now = Date.now();

    if (!isForced && now - lastSaved < SAVE_PROGRESS_AT_MOST_EVERY) {
      return;
    }

    lastSaved = now;
    store.write(INDEX, JSON.stringify({ held: rows }));

    for (const listener of listeners) {
      listener(rows);
    }
  };

  const change = (downloadId: string, to: Partial<HeldFile>, isForced = true) => {
    rows = rows.map((row) => (row.downloadId === downloadId ? { ...row, ...to } : row));
    save(isForced);
  };

  const fetchThePoster = async (row: HeldFile, cookie: string | null) => {
    const fetched = await downloadAsync(
      onThisServer(`/api/media/${row.mediaId}/image/poster`),
      posterOf(row.downloadId),
      cookie === null ? {} : { headers: { Cookie: cookie } },
    ).catch(() => null);

    change(row.downloadId, { hasPoster: fetched !== null && fetched.status === 200 });
  };

  const fetchTheTrickplay = async (row: HeldFile, cookie: string | null) => {
    const wanted = await trickplayToKeep(askTheServer, row.mediaId);

    if (wanted === null) {
      return;
    }

    const kept = trickplayOf(row.downloadId);

    try {
      await makeDirectoryAsync(kept, { intermediates: true });
      await writeAsStringAsync(`${kept}${KEPT_TRICKPLAY_INDEX}`, wanted.vtt);

      for (const sheet of wanted.sheets) {
        const fetched = await downloadAsync(
          onThisServer(sheet.from),
          `${kept}${sheet.name}`,
          cookie === null ? {} : { headers: { Cookie: cookie } },
        );

        if (fetched.status !== 200) {
          throw new Error(`The sheet ${sheet.name} did not come.`);
        }
      }

      if (!rows.some((one) => one.downloadId === row.downloadId)) {
        throw new Error('It was forgotten while its thumbnails were fetched.');
      }

      change(row.downloadId, { hasTrickplay: true });
    } catch {
      await deleteAsync(kept, { idempotent: true }).catch(() => undefined);
    }
  };

  const fetchTheFilm = async (row: HeldFile) => {
    const run = (runs.get(row.downloadId) ?? 0) + 1;

    runs.set(row.downloadId, run);
    alreadyStarted.add(row.downloadId);
    await makeDirectoryAsync(FOLDER, { intermediates: true }).catch(() => undefined);

    const address = onThisServer(`/api/downloads/${row.downloadId}/file`);
    const cookie = await theCookiesThisPhoneHolds(address);
    const resumeData =
      store.read(`${HELD_RESUMES}${row.downloadId}`) ??
      (await readAside(`${HELD_RESUMES}${row.downloadId}`).catch(() => null));
    let lastAt = Date.now();
    let lastBytes = row.bytes;

    const transfer = createDownloadResumable(
      address,
      filmOf(row.downloadId),
      cookie === null ? {} : { headers: { Cookie: cookie } },
      (progress) => {
        const now = Date.now();
        const seconds = (now - lastAt) / 1000;
        const rate =
          seconds > 0 ? Math.round((progress.totalBytesWritten - lastBytes) / seconds) : null;

        lastAt = now;
        lastBytes = progress.totalBytesWritten;
        change(
          row.downloadId,
          {
            bytes: progress.totalBytesWritten,
            bytesPerSecond: rate === null ? null : Math.max(rate, 0),
            ...(progress.totalBytesExpectedToWrite > 0
              ? { ofBytes: progress.totalBytesExpectedToWrite }
              : {}),
          },
          false,
        );
      },
      resumeData ?? undefined,
    );

    transfers.set(row.downloadId, transfer);

    const done = await (resumeData === null ? transfer.downloadAsync() : transfer.resumeAsync())
      .then((result) => result ?? null)
      .catch(() => null);

    if (runs.get(row.downloadId) !== run) {
      return;
    }

    transfers.delete(row.downloadId);

    const now = rows.find((one) => one.downloadId === row.downloadId);

    if (now === undefined || now.state === 'paused') {
      return;
    }

    if (done === null || (done.status !== 200 && done.status !== 206)) {
      const placeToResume = done === null ? transfer.savable().resumeData : undefined;

      if (placeToResume !== undefined) {
        store.write(`${HELD_RESUMES}${row.downloadId}`, placeToResume);
      }

      change(row.downloadId, {
        state: 'failed',
        bytesPerSecond: null,
        failure: say('phone.platform.thePhonesHeldFiles.theFileCouldNotBeFetched'),
      });

      return;
    }

    const onTheDisk = await getInfoAsync(filmOf(row.downloadId)).catch(() => null);
    const size = onTheDisk !== null && onTheDisk.exists ? onTheDisk.size : null;

    if (size === null || (now.ofBytes !== null && size !== now.ofBytes)) {
      store.forget(`${HELD_RESUMES}${row.downloadId}`);
      change(row.downloadId, {
        state: 'failed',
        bytesPerSecond: null,
        failure: say('phone.platform.thePhonesHeldFiles.theFileArrivedIncomplete'),
      });

      return;
    }

    store.forget(`${HELD_RESUMES}${row.downloadId}`);
    change(row.downloadId, { state: 'here', bytesPerSecond: null, failure: null });
    await fetchThePoster(now, cookie);
    await fetchTheTrickplay(now, cookie);
  };

  const keepAPlaceToResumeFrom = async () => {
    for (const [downloadId, transfer] of transfers) {
      const paused = await transfer.pauseAsync().catch(() => null);

      if (paused?.resumeData !== undefined) {
        store.write(`${HELD_RESUMES}${downloadId}`, paused.resumeData);
      }

      const row = rows.find((one) => one.downloadId === downloadId);

      if (paused !== null && row?.state === 'fetching') {
        void fetchTheFilm(row);
      }
    }
  };

  whenLeaving(() => {
    void keepAPlaceToResumeFrom();
  });

  const leftFetching = rows.filter((row) => row.state === 'fetching').map((row) => row.downloadId);
  const leftWithoutThumbnails = rows.filter((row) => row.state === 'here' && !row.hasTrickplay);

  if (leftWithoutThumbnails.length > 0) {
    whenSettled(() => {
      void theCookiesThisPhoneHolds(onThisServer('/api/playback')).then(async (cookie) => {
        for (const row of leftWithoutThumbnails) {
          await fetchTheTrickplay(row, cookie);
        }
      });
    });
  }

  if (leftFetching.length > 0) {
    whenSettled(() => {
      for (const row of rows) {
        if (
          leftFetching.includes(row.downloadId) &&
          row.state === 'fetching' &&
          !alreadyStarted.has(row.downloadId)
        ) {
          void fetchTheFilm(row);
        }
      }
    });
  }

  return {
    all: async () => {
      const gone = await Promise.all(
        rows.map(async (row) =>
          row.state !== 'here' ||
          (await getInfoAsync(filmOf(row.downloadId)).catch(() => ({ exists: false }))).exists
            ? null
            : row.downloadId,
        ),
      );
      const missing = new Set(gone.filter((downloadId) => downloadId !== null));

      if (missing.size > 0) {
        rows = rows.filter((row) => !missing.has(row.downloadId));
        save();
      }

      return rows;
    },

    keep: async (what) => {
      if (rows.some((row) => row.downloadId === what.downloadId)) {
        return;
      }

      const row: HeldFile = {
        ...what,
        state: 'fetching',
        bytes: 0,
        bytesPerSecond: null,
        failure: null,
        keptAt: new Date().toISOString(),
        hasPoster: false,
        hasTrickplay: false,
      };

      rows = [row, ...rows];
      save();
      await fetchTheFilm(row);
    },

    drop: async (downloadId) => {
      const transfer = transfers.get(downloadId);

      transfers.delete(downloadId);
      rows = rows.filter((row) => row.downloadId !== downloadId);
      store.forget(`${HELD_RESUMES}${downloadId}`);
      save();

      await transfer?.pauseAsync().catch(() => undefined);
      await deleteAsync(filmOf(downloadId), { idempotent: true }).catch(() => undefined);
      await deleteAsync(posterOf(downloadId), { idempotent: true }).catch(() => undefined);
      await deleteAsync(trickplayOf(downloadId), { idempotent: true }).catch(() => undefined);
    },

    pause: async (downloadId, isPaused) => {
      const row = rows.find((one) => one.downloadId === downloadId);

      if (row === undefined) {
        return;
      }

      if (isPaused) {
        const transfer = transfers.get(downloadId);

        change(downloadId, { state: 'paused', bytesPerSecond: null });

        const paused = await transfer?.pauseAsync().catch(() => null);

        if (paused?.resumeData !== undefined) {
          store.write(`${HELD_RESUMES}${downloadId}`, paused.resumeData);
        }

        return;
      }

      change(downloadId, { state: 'fetching', failure: null });
      await fetchTheFilm({ ...row, state: 'fetching', failure: null });
    },

    sourceFor: filmOf,

    posterFor: posterOf,

    trickplayFor: async (downloadId) => {
      const index = `${trickplayOf(downloadId)}${KEPT_TRICKPLAY_INDEX}`;
      const vtt = await readAsStringAsync(index).catch(() => null);

      return vtt === null ? null : keptTrickplayFrom(vtt, index);
    },

    whenChanged: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export { thePhonesHeldFiles };
