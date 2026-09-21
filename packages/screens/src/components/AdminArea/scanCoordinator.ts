import {
  scanLibrary,
  resetLibrary,
  regenerateLibraryPreviews,
} from '@ValenceClient/library/fetchLibrary';
import { cancelJob, fetchRunningScans, runJob } from '@ValenceClient/admin/fetchAdmin';
import { waitForScanCompletion } from '@ValenceClient/library/waitForScanCompletion';
import type { ScanJob } from '@ValenceClient/library/fetchLibrary';
import type { Library } from '@ValenceContracts/schemas/Library';
import { LIBRARY_PARTS_BY_KIND } from '@ValenceContracts/schemas/LibraryPart';
import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';

type ScanEntry = {
  libraryId: string;
  kind: string;
  phase: string | null;
  item: string | null;
  processed: number | null;
  total: number | null;
  jobId: string | null;
  isStopping: boolean;
};

type ScanSnapshot = {
  progress: ReadonlyMap<string, ScanEntry>;
  isScanningAll: boolean;
  isResettingAll: boolean;
};

let progress = new Map<string, ScanEntry>();
let stopping = new Set<string>();
let isScanningAll = false;
let isResettingAll = false;
let snapshot: ScanSnapshot = { progress, isScanningAll, isResettingAll };
const listeners = new Set<() => void>();

/**
 * Publishes a fresh snapshot and tells every listener about it. The snapshot is rebuilt rather than
 * mutated, since `useSyncExternalStore` decides whether to render by comparing the two.
 */
/**
 * Names one piece of work, which is a library and a kind rather than a library alone.
 *
 * A library can be read while its thumbnails are still being drawn, so more than one thing runs
 * against it at once. Keyed by library, the two overwrote each other every poll, whichever finished
 * first hid the other by clearing the entry, and stopping one could only ever find the kind that
 * happened to be written down.
 *
 * @param libraryId - The library the work is against, or a kind for work about no library.
 * @param kind - What the work is.
 * @returns The key it is tracked under.
 */
const keyOf = (libraryId: string, kind: string): string => `${libraryId}:${kind}`;

const notify = () => {
  snapshot = { progress, isScanningAll, isResettingAll };

  for (const listener of listeners) {
    listener();
  }
};

/**
 * Registers a listener for changes to what is running. This module is shared state outside React so
 * that a scan started in one panel is still tracked when the administrator moves to another, and
 * this is what lets `useSyncExternalStore` drive a component from it.
 *
 * @param listener - Called whenever what is running changes.
 * @returns How to stop listening.
 */
const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

/**
 * The current state of what is running, for `useSyncExternalStore` to read.
 *
 * @returns What is running now.
 */
const getSnapshot = (): ScanSnapshot => snapshot;

/**
 * Records what one library's job is doing now, replacing whatever was recorded before.
 *
 * @param libraryId - The library being worked on.
 * @param entry - What its job is doing.
 */
const track = (key: string, entry: Omit<ScanEntry, 'isStopping'>) => {
  progress = new Map(progress).set(key, { ...entry, isStopping: stopping.has(key) });
  notify();
};

/**
 * Forgets a library's job, once it has ended however it ended. Does nothing where there was nothing
 * recorded, so that tidying up twice is harmless.
 *
 * @param libraryId - The library to forget.
 */
const untrack = (key: string) => {
  stopping.delete(key);

  if (!progress.has(key)) {
    return;
  }

  const next = new Map(progress);

  next.delete(key);
  progress = next;
  notify();
};

/**
 * Queues one library's job and follows it to the end, publishing its progress as it goes and clearing
 * it afterwards however it ended. Everything that starts work goes through here, so that a job is
 * tracked the same way whether it was started from a panel, resumed after a reload, or picked up
 * from another tab.
 *
 * @param libraryId - The library the work belongs to.
 * @param kind - What the work is.
 * @param enqueue - How to ask the server to start it.
 * @returns Whether the server took the work, which is not the same as whether it went well.
 */
const runAndTrack = async (
  libraryId: string,
  kind: string,
  enqueue: () => Promise<ScanJob | null>,
): Promise<boolean> => {
  const key = keyOf(libraryId, kind);

  track(key, {
    libraryId,
    kind,
    phase: null,
    processed: null,
    total: null,
    item: null,
    jobId: null,
  });

  try {
    const job = await enqueue();

    if (job === null) {
      return false;
    }

    track(key, {
      libraryId,
      kind,
      phase: null,
      item: null,
      processed: null,
      total: null,
      jobId: job.jobId,
    });

    await waitForScanCompletion(job.jobId, (found) => {
      track(key, {
        libraryId,
        kind,
        phase: found.phase,
        item: found.item,
        processed: found.processed,
        total: found.total,
        jobId: job.jobId,
      });
    });

    return true;
  } finally {
    untrack(key);
  }
};

/**
 * Picks up work the server is already running, so that reloading the page mid-scan shows its
 * progress rather than an idle library. Ignores work this page is already following.
 *
 * Keyed by library this dropped the second of two jobs on one library before it was ever tracked,
 * so a thumbnail render begun before a reload was invisible for the whole of its life.
 */
const resumeRunning = async (): Promise<void> => {
  const running = await fetchRunningScans().catch(() => []);

  await Promise.all(
    running
      .filter((scan) => scan.libraryId !== null)
      .map(async (scan) => {
        const libraryId = scan.libraryId ?? '';
        const key = keyOf(libraryId, scan.kind);

        if (snapshot.progress.has(key)) {
          return;
        }

        track(key, {
          libraryId,
          kind: scan.kind,
          phase: scan.phase,
          item: scan.item,
          processed: scan.processed,
          total: scan.total,
          jobId: scan.jobId,
        });

        try {
          await waitForScanCompletion(scan.jobId, (found) => {
            track(key, {
              libraryId,
              kind: scan.kind,
              phase: found.phase,
              item: found.item,
              processed: found.processed,
              total: found.total,
              jobId: scan.jobId,
            });
          });
        } finally {
          untrack(key);
        }
      }),
  );
};

/**
 * Follows a job somebody else queued, as though this page had started it, so a scan begun in another
 * tab shows the same progress here.
 *
 * @param libraryId - The library being worked on.
 * @param kind - What the work is.
 * @param jobId - The job to follow.
 */
const watchJob = (libraryId: string, kind: string, jobId: string): Promise<void> =>
  runAndTrack(libraryId, kind, () => Promise.resolve({ jobId, state: 'queued' })).then(
    () => undefined,
  );

/**
 * Scans one library, tracking its progress until it finishes. Scanning reads what has changed;
 * forcing re-probes every file, which is what to do when the catalogue is wrong rather than merely
 * out of date.
 *
 * @param libraryId - The library to scan.
 * @param force - Whether to re-probe every file rather than only what has changed.
 * @returns Whether the server took the scan.
 */
const startScan = (libraryId: string, force = false): Promise<boolean> =>
  runAndTrack(libraryId, force ? 'rescan' : 'scan', () => scanLibrary(libraryId, force));

/**
 * Scans every library at once, re-probing every file. Tracked as one thing as well as per library, so
 * the page can show that a sweep is under way rather than only that several libraries happen to be
 * scanning.
 *
 * @param libraries - The libraries to scan.
 */
const startScanAll = async (libraries: readonly Library[]): Promise<boolean> => {
  isScanningAll = true;
  notify();

  const run = { id: crypto.randomUUID(), of: libraries.length };

  try {
    const taken = await Promise.all(
      libraries.map((library) =>
        runAndTrack(library.id, 'scan', () => scanLibrary(library.id, true, run)),
      ),
    );

    return taken.every(Boolean);
  } finally {
    isScanningAll = false;
    notify();
  }
};

/**
 * Deletes and rebuilds every library from nothing, which is the answer to a catalogue that has gone
 * wrong in a way no rescan will correct.
 *
 * @param libraries - The libraries to rebuild.
 */
const startResetAll = async (libraries: readonly Library[]): Promise<boolean> => {
  isResettingAll = true;
  notify();

  try {
    const taken = await Promise.all(
      libraries.map((library) => runAndTrack(library.id, 'scan', () => resetLibrary(library.id))),
    );

    return taken.every(Boolean);
  } finally {
    isResettingAll = false;
    notify();
  }
};

/**
 * Regenerates one library's previews against its current forced language, for after that setting has
 * been changed and the previews already made no longer match it.
 *
 * @param libraryId - The library to regenerate previews for.
 */
const startRegeneratePreviews = (libraryId: string): Promise<boolean> =>
  runAndTrack(libraryId, 'regeneratePreviews', () => regenerateLibraryPreviews(libraryId));

/**
 * Starts a job by kind, as picked from the Work tab's registry, against one library or against the
 * server as a whole.
 *
 * @param kind - The job to run.
 * @param libraryId - The library to run it against, where it takes one.
 * @param force - Whether to redo work already done.
 */
const runDefinedJob = (kind: string, libraryId?: string, force?: boolean): Promise<boolean> =>
  runAndTrack(libraryId ?? kind, kind, () => runJob(kind, libraryId, force));

/**
 * Starts a job by kind against every library at once, each tracked separately so the progress shows
 * which library is where rather than one bar for all of them.
 *
 * @param kind - The job to run.
 * @param libraries - The libraries to run it against.
 * @param force - Whether to redo work already done.
 */
const runDefinedJobAll = (
  kind: string,
  libraries: readonly Library[],
  force?: boolean,
): Promise<boolean> =>
  Promise.all(libraries.map((library) => runDefinedJob(kind, library.id, force))).then((taken) =>
    taken.every(Boolean),
  );

/**
 * Clears parts of several libraries at once, each tracked separately. A library is only asked to
 * clear the parts a library of its kind has, and one with none of them is left alone, so picking
 * album covers and trailers across a music and a film library clears each of what it holds.
 *
 * @param kind - The job that clears parts.
 * @param libraries - The libraries to clear parts of.
 * @param parts - The parts to clear.
 */
const clearPartsOfAll = (
  kind: string,
  libraries: readonly Library[],
  parts: readonly LibraryPart[],
): Promise<boolean> =>
  Promise.all(
    libraries.flatMap((library) => {
      const offered = parts.filter((part) => LIBRARY_PARTS_BY_KIND[library.kind].includes(part));

      return offered.length === 0
        ? []
        : [runAndTrack(library.id, kind, () => runJob(kind, library.id, undefined, offered))];
    }),
  ).then((taken) => taken.every(Boolean));

export type { ScanEntry };

/**
 * Asks every run of one job kind to stop, whichever library each is working on. Each is marked as
 * stopping at once and stays so until it has ended, since a run finishes what it has already started
 * before it stops and can go on saying it is running for some time after it was asked not to.
 *
 * @param kind - The job kind to stop.
 * @returns Whether the server accepted every request to stop.
 */
const stopJobs = async (kind: string): Promise<boolean> => {
  const running = [...snapshot.progress.entries()].filter(
    ([, entry]) => entry.kind === kind && entry.jobId !== null,
  );

  running.forEach(([key]) => {
    stopping.add(key);
  });
  progress = new Map(
    [...progress.entries()].map(([key, entry]) => [
      key,
      stopping.has(key) ? { ...entry, isStopping: true } : entry,
    ]),
  );
  notify();

  const answers = await Promise.all(running.map(([, entry]) => cancelJob(entry.jobId ?? '')));

  return answers.every(Boolean);
};

/**
 * Empties everything this module holds, so that one test's running scans are not still running in
 * the next. Nothing but a test has any business calling this.
 */
const resetForTests = () => {
  progress = new Map();
  stopping = new Set();
  isScanningAll = false;
  isResettingAll = false;
  notify();
};

export {
  subscribe,
  getSnapshot,
  resumeRunning,
  watchJob,
  startScan,
  startScanAll,
  startResetAll,
  startRegeneratePreviews,
  runDefinedJob,
  runDefinedJobAll,
  clearPartsOfAll,
  stopJobs,
  resetForTests,
};
