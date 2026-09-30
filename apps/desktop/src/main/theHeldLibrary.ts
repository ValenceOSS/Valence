import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { HeldFile, WhatToKeep } from '@ValenceContracts/schemas/HeldFile';
import { keepADownload } from '@ValenceDesktop/main/keepADownload';
import type { AskingTheServer, Fetching, Outcome } from '@ValenceDesktop/main/keepADownload';
import { KEPT_TRICKPLAY_INDEX } from '@ValenceClient/downloads/KEPT_TRICKPLAY_INDEX';
import { trickplayToKeep } from '@ValenceClient/downloads/trickplayToKeep';
import { theFileKept, thePosterKept, theTrickplayKept } from '@ValenceDesktop/main/theHeldFolder';
import type { HeldIndex } from '@ValenceDesktop/main/theHeldIndex';
import { say } from '@ValenceI18n/say';

type HeldLibrary = {
  all: () => Promise<HeldFile[]>;
  keep: (what: WhatToKeep) => Promise<void>;
  drop: (downloadId: string) => Promise<void>;
  pause: (downloadId: string, isPaused: boolean) => Promise<void>;
  carryOnWhereItLeftOff: () => Promise<void>;
  whenChanged: (listener: (held: HeldFile[]) => void) => () => void;
};

type WhatTheLibraryNeeds = {
  folder: string;
  index: HeldIndex;
  where: () => string;
  fetching: AskingTheServer;
  now: () => string;
};

/**
 * How much of a file is already on the disk.
 *
 * Asked of the disk rather than remembered, because the disk is the thing that is actually true. A
 * transfer that was interrupted by the application being killed rather than closed never got to
 * write down where it had reached, and resuming from a remembered figure that is smaller than the
 * file would repeat bytes and corrupt it.
 *
 * @param path - The file.
 * @returns Its length, or nothing at all where it is not there.
 */
const howMuchIsThere = async (path: string): Promise<number> => {
  const there = await stat(path).catch(() => null);

  return there === null ? 0 : there.size;
};

/**
 * Everything this machine is holding, and everything it is in the middle of fetching.
 *
 * The one place that knows what is on this disk. It owns the transfers, the index that describes
 * them, and the artwork beside them, and it is the only thing the window can ask — which is what
 * keeps the window from needing to know anything about files at all.
 *
 * Transfers are made by this process rather than handed to the browser's downloader. That is the
 * difference between a file Valence can play and a file in somebody's Downloads folder: this one has
 * a name we chose, a length we can check, and a place we can find it again after a restart.
 *
 * Nothing here decides whether to be offline. It fetches when it can and stops when it cannot, and a
 * transfer that could not reach the server is left saying so rather than thrown away — a laptop shut
 * on a half-finished film should open on a half-finished film, not on an empty shelf.
 *
 * @param needs - Where files go, what remembers them, where the server is, how to fetch, and what
 * time it is.
 * @returns The library.
 */
const theHeldLibrary = (needs: WhatTheLibraryNeeds): HeldLibrary => {
  const busy = new Map<string, Fetching>();
  const thumbnailing = new Map<string, Promise<boolean>>();
  const listeners = new Set<(held: HeldFile[]) => void>();

  const all = async (): Promise<HeldFile[]> => {
    const rows = needs.index.all();

    const checked = await Promise.all(
      rows.map(async (row) => {
        if (row.state !== 'here') {
          return row;
        }

        const there = await howMuchIsThere(theFileKept(needs.folder, row.downloadId));

        if (there === 0) {
          needs.index.forget(row.downloadId);

          return null;
        }

        return row;
      }),
    );

    return checked.filter((row): row is HeldFile => row !== null);
  };

  const announce = async (): Promise<void> => {
    const held = await all();

    for (const listener of listeners) {
      listener(held);
    }
  };

  /**
   * Fetches the artwork beside the film, so a shelf of downloads is not a shelf of grey rectangles.
   *
   * Failing to get it is not failing to keep the film — not when the server will not hand it over,
   * and not when the disk will not take it. Somebody on a plane with a film and no poster has what
   * they came for; somebody told their download failed because an image did not arrive has been
   * lied to.
   *
   * @param row - What was kept.
   * @returns Whether there is now a poster to draw.
   */
  const fetchThePoster = async (row: HeldFile): Promise<boolean> => {
    const server = needs.where();

    if (server === '') {
      return row.hasPoster;
    }

    const answer = await needs
      .fetching(new URL(`/api/media/${row.mediaId}/image/poster`, server).toString())
      .catch(() => null);

    if (answer === null || !answer.ok) {
      return row.hasPoster;
    }

    const image = Buffer.from(await answer.arrayBuffer());

    return writeFile(thePosterKept(needs.folder, row.downloadId), image).then(
      () => true,
      () => row.hasPoster,
    );
  };

  /**
   * Fetches the thumbnails shown while scrubbing, so a film watched on a plane can be scrubbed
   * through the way it can at home.
   *
   * Kept whole or not at all: an index naming sheets that never arrived would draw holes. Like the
   * poster, not getting them is not failing to keep the film, and the server may simply not have
   * made them yet — asking is what has it start, and a later attempt picks them up. A fetch already
   * under way for the film is shared rather than started again.
   *
   * @param row - What was kept.
   * @returns Whether there are now thumbnails to draw.
   */
  const fetchTheTrickplay = async (row: HeldFile): Promise<boolean> => {
    const already = thumbnailing.get(row.downloadId);

    if (already !== undefined) {
      return already;
    }

    const fetching = fetchTheSheets(row).finally(() => {
      thumbnailing.delete(row.downloadId);
    });

    thumbnailing.set(row.downloadId, fetching);

    return fetching;
  };

  /**
   * Fetches the index and every sheet it names into the film's thumbnail folder, for one fetch at a
   * time per film: two at once would share the folder, and one failing would empty it under the
   * other.
   *
   * @param row - What was kept.
   * @returns Whether there are now thumbnails to draw.
   */
  const fetchTheSheets = async (row: HeldFile): Promise<boolean> => {
    const server = needs.where();

    if (server === '') {
      return row.hasTrickplay;
    }

    const ask = (path: string, how?: RequestInit) =>
      needs.fetching(new URL(path, server).toString(), how);
    const wanted = await trickplayToKeep(ask, row.mediaId);

    if (wanted === null) {
      return row.hasTrickplay;
    }

    const kept = theTrickplayKept(needs.folder, row.downloadId);

    try {
      await mkdir(kept, { recursive: true });
      await writeFile(join(kept, KEPT_TRICKPLAY_INDEX), wanted.vtt);

      for (const sheet of wanted.sheets) {
        const answer = await ask(sheet.from);

        if (!answer.ok) {
          throw new Error(`The sheet ${sheet.name} did not come.`);
        }

        await writeFile(join(kept, sheet.name), Buffer.from(await answer.arrayBuffer()));
      }

      if (needs.index.read(row.downloadId) === null) {
        throw new Error('It was forgotten while its thumbnails were fetched.');
      }

      return true;
    } catch {
      await rm(kept, { recursive: true, force: true });

      return false;
    }
  };

  /**
   * Records where a transfer got to, and what happened to it.
   *
   * Read from the index again rather than written over the row this started with, because the row
   * this started with is as old as the transfer. Somebody may have paused it, dropped it, or asked
   * for it a second time in the minutes since.
   *
   * @param downloadId - The prepared download.
   * @param change - What is now true of it.
   */
  const note = (downloadId: string, change: Partial<HeldFile>): void => {
    const current = needs.index.read(downloadId);

    if (current !== null) {
      needs.index.write({ ...current, ...change });
    }
  };

  const start = (row: HeldFile): void => {
    const server = needs.where();

    if (server === '') {
      note(row.downloadId, { state: 'failed', failure: say('common.noValenceHasBeenChosenYet') });

      return;
    }

    const fetching = keepADownload({
      from: new URL(`/api/downloads/${row.downloadId}/file`, server).toString(),
      onto: theFileKept(needs.folder, row.downloadId),
      already: row.bytes,
      fetching: needs.fetching,
      report: (progress) => {
        note(row.downloadId, {
          bytes: progress.bytes,
          bytesPerSecond: progress.bytesPerSecond,
          ...(progress.ofBytes === null ? {} : { ofBytes: progress.ofBytes }),
        });

        void announce();
      },
    });

    busy.set(row.downloadId, fetching);

    const settle = async (outcome: Outcome): Promise<void> => {
      busy.delete(row.downloadId);

      if (needs.index.read(row.downloadId) === null) {
        return;
      }

      const hasPoster = outcome.isComplete ? await fetchThePoster(row) : row.hasPoster;
      const hasTrickplay = outcome.isComplete ? await fetchTheTrickplay(row) : row.hasTrickplay;

      note(row.downloadId, {
        bytes: outcome.bytes,
        bytesPerSecond: null,
        hasPoster,
        hasTrickplay,
        ...(outcome.isComplete
          ? { state: 'here', failure: null }
          : outcome.failure === null
            ? { state: 'paused' }
            : { state: 'failed', failure: outcome.failure }),
      });

      await announce();
    };

    void fetching.finished.then(settle).catch(() => {
      note(row.downloadId, {
        state: 'failed',
        bytesPerSecond: null,
        failure: say('desktop.main.theHeldLibrary.thisClientCouldNotFinishKeeping'),
      });
    });
  };

  /**
   * Fetches the thumbnails of films kept before the server had made them, one at a time and after
   * any interrupted film has been set going again, so nothing a person is waiting for waits on them.
   */
  const fillInTheThumbnails = async (): Promise<void> => {
    for (const row of needs.index.all()) {
      if (row.state === 'here' && !row.hasTrickplay && !busy.has(row.downloadId)) {
        const hasTrickplay = await fetchTheTrickplay(row);

        if (hasTrickplay) {
          note(row.downloadId, { hasTrickplay });
          await announce();
        }
      }
    }
  };

  return {
    all,
    keep: async (what) => {
      if (busy.has(what.downloadId)) {
        return;
      }

      const already = needs.index.read(what.downloadId);

      if (already?.state === 'here') {
        return;
      }

      await mkdir(needs.folder, { recursive: true });

      const onDisk = await howMuchIsThere(theFileKept(needs.folder, what.downloadId));

      const row: HeldFile = {
        ...what,
        state: 'fetching',
        bytes: onDisk,
        bytesPerSecond: null,
        failure: null,
        keptAt: already?.keptAt ?? needs.now(),
        hasPoster: already?.hasPoster ?? false,
        hasTrickplay: already?.hasTrickplay ?? false,
      };

      needs.index.write(row);
      start(row);

      await announce();
    },
    drop: async (downloadId) => {
      const fetching = busy.get(downloadId);

      if (fetching !== undefined) {
        fetching.stop();
        await fetching.finished;
      }

      needs.index.forget(downloadId);

      await rm(theFileKept(needs.folder, downloadId), { force: true });
      await rm(thePosterKept(needs.folder, downloadId), { force: true });
      await rm(theTrickplayKept(needs.folder, downloadId), { recursive: true, force: true });

      await announce();
    },
    pause: async (downloadId, isPaused) => {
      if (isPaused) {
        busy.get(downloadId)?.stop();

        return;
      }

      const row = needs.index.read(downloadId);

      if (row === null || busy.has(downloadId) || row.state === 'here') {
        return;
      }

      note(downloadId, { state: 'fetching', failure: null });

      start({
        ...row,
        state: 'fetching',
        bytes: await howMuchIsThere(theFileKept(needs.folder, downloadId)),
      });

      await announce();
    },
    carryOnWhereItLeftOff: async () => {
      for (const row of needs.index.all()) {
        if (busy.has(row.downloadId) || row.state === 'here' || row.state === 'paused') {
          continue;
        }

        note(row.downloadId, { state: 'fetching', failure: null });

        start({
          ...row,
          state: 'fetching',
          bytes: await howMuchIsThere(theFileKept(needs.folder, row.downloadId)),
        });
      }

      await announce();

      void fillInTheThumbnails();
    },
    whenChanged: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export type { HeldLibrary, WhatTheLibraryNeeds };

export { theHeldLibrary };
