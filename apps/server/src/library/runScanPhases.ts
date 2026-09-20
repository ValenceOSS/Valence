import type { ScanResult } from '@ValenceContracts/schemas/Library';

type ScanPhaseWork = {
  scan: () => Promise<ScanResult | null>;
  lookUp: () => Promise<void>;
};

type ScanPhaseOptions = {
  work: ScanPhaseWork;
  isCancelled: () => boolean;
  onScanned: (result: ScanResult) => Promise<void>;
  onRead: () => Promise<void>;
};

const PHASES = ['scan', 'lookUp'] as const;

/**
 * Reads a library, and no more than that.
 *
 * Everything that enriches what was read — the lettering, the intros, the clips and the scrub
 * thumbnails — is asked for rather than done. `onRead` runs once the reading is finished, queues
 * each of them as work of its own, and this returns.
 *
 * Which matters most when there is more than one library. Reading is one queue, so libraries are
 * read one after another, and anything a library does before it lets go of that queue is time every
 * other library spends unread. Finding the intros in a film library is hours; doing it inside the
 * scan meant nobody could watch a programme until it finished, because the programmes had not been
 * read yet. Now each library is read, the next library is read, and the enriching happens on its
 * own queues beside them.
 *
 * Music is the exception and looks its titles up here: what it asks the catalogue is part of
 * reading a track rather than something added to it afterwards, and there is no queue of its own to
 * ask.
 *
 * Every piece of that work reads what is outstanding rather than what this scan happened to import,
 * so asking for it over a library that is already complete costs a query and nothing else. That is
 * what makes it safe to ask every time rather than remembering what each file still needs.
 *
 * Cancellation is checked between phases rather than within them, so a cancelled scan stops at the
 * next boundary rather than abandoning work half-written — and a cancelled scan asks for nothing,
 * since stopping a scan should not start the longest work in the system.
 *
 * @param work - Reading the library, and the looking up that only music does here.
 * @param isCancelled - Whether the job has been asked to stop.
 * @param onScanned - Told what the reading phase changed, where it reported anything.
 * @param onRead - Asks for everything the library is still missing, once it has been read.
 */
const runScanPhases = async ({
  work,
  isCancelled,
  onScanned,
  onRead,
}: ScanPhaseOptions): Promise<void> => {
  for (const phase of PHASES) {
    if (isCancelled()) {
      return;
    }

    if (phase !== 'scan') {
      await work[phase]();

      continue;
    }

    const result = await work.scan();

    if (result !== null) {
      await onScanned(result);
    }
  }

  if (isCancelled()) {
    return;
  }

  await onRead();
};

export type { ScanPhaseWork, ScanPhaseOptions };

export { runScanPhases, PHASES };
