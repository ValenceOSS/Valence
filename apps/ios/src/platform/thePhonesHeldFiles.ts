import {
  createDownloadResumable,
  deleteAsync,
  documentDirectory,
  downloadAsync,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';
import { HeldFileListSchema } from '@ValenceContracts/schemas/HeldFile';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { theCookiesThisPhoneHolds } from '@ValencePhone/platform/theCookiesThisPhoneHolds';
import type { DownloadResumable } from 'expo-file-system/legacy';
import type { DeviceStore, HeldFiles } from '@ValenceClient/platform/Platform.types';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';

const INDEX = 'valence.held';

const RESUMING = 'valence.held.resume.';

const FOLDER = `${documentDirectory ?? ''}held/`;

const TELL_AT_MOST_EVERY = 1000;

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
 * The files this phone keeps for watching without the server, as the desktop keeps them: each
 * fetched from what the server prepared, with its poster beside it, and a list of them kept in the
 * phone's store so they are known again after the app has closed.
 *
 * A fetch can be paused and picked up again, and one the app closed partway through is picked up
 * where it stopped the next time the app starts. Each carries this phone's session, which the
 * server asks for before it hands a file over.
 *
 * @param store - Where the list of them is kept.
 * @returns What the platform keeps files through.
 */
const thePhonesHeldFiles = (store: DeviceStore): HeldFiles => {
  const read = HeldFileListSchema.safeParse(JSON.parse(store.read(INDEX) ?? '{"held":[]}'));
  let rows: HeldFile[] = read.success ? read.data.held : [];
  const transfers = new Map<string, DownloadResumable>();
  const listeners = new Set<(held: HeldFile[]) => void>();
  let lastTold = 0;

  const save = (isForced = true) => {
    store.write(INDEX, JSON.stringify({ held: rows }));

    const now = Date.now();

    if (isForced || now - lastTold >= TELL_AT_MOST_EVERY) {
      lastTold = now;

      for (const listener of listeners) {
        listener(rows);
      }
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

  const fetchTheFilm = async (row: HeldFile) => {
    await makeDirectoryAsync(FOLDER, { intermediates: true }).catch(() => undefined);

    const address = onThisServer(`/api/downloads/${row.downloadId}/file`);
    const cookie = await theCookiesThisPhoneHolds(address);
    const resumeData = store.read(`${RESUMING}${row.downloadId}`);
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

    transfers.delete(row.downloadId);

    const now = rows.find((one) => one.downloadId === row.downloadId);

    if (now === undefined || now.state === 'paused') {
      return;
    }

    if (done === null || (done.status !== 200 && done.status !== 206)) {
      change(row.downloadId, {
        state: 'failed',
        bytesPerSecond: null,
        failure: 'The file could not be fetched from the server.',
      });

      return;
    }

    store.forget(`${RESUMING}${row.downloadId}`);
    change(row.downloadId, { state: 'here', bytesPerSecond: null, failure: null });
    await fetchThePoster(now, cookie);
  };

  for (const row of rows) {
    if (row.state === 'fetching') {
      void fetchTheFilm(row);
    }
  }

  return {
    all: async () => {
      const found = await Promise.all(
        rows.map(async (row) =>
          row.state !== 'here' ||
          (await getInfoAsync(filmOf(row.downloadId)).catch(() => ({ exists: false }))).exists
            ? row
            : null,
        ),
      );

      rows = found.filter((row) => row !== null);
      save();

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
      };

      rows = [row, ...rows];
      save();
      await fetchTheFilm(row);
    },

    drop: async (downloadId) => {
      const transfer = transfers.get(downloadId);

      transfers.delete(downloadId);
      rows = rows.filter((row) => row.downloadId !== downloadId);
      store.forget(`${RESUMING}${downloadId}`);
      save();

      await transfer?.pauseAsync().catch(() => undefined);
      await deleteAsync(filmOf(downloadId), { idempotent: true }).catch(() => undefined);
      await deleteAsync(posterOf(downloadId), { idempotent: true }).catch(() => undefined);
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
          store.write(`${RESUMING}${downloadId}`, paused.resumeData);
        }

        return;
      }

      change(downloadId, { state: 'fetching' });
      await fetchTheFilm({ ...row, state: 'fetching' });
    },

    sourceFor: filmOf,

    posterFor: posterOf,

    whenChanged: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export { thePhonesHeldFiles };
