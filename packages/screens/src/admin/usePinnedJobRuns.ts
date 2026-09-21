import { useCallback, useMemo, useState } from 'react';
import { z } from 'zod';

const KEY = 'valence.pinnedJobRuns';

const MOST_KEPT = 20;

const PinnedSchema = z.array(z.string());

const readPinned = (): string[] => {
  try {
    const read = PinnedSchema.safeParse(JSON.parse(window.localStorage.getItem(KEY) ?? '[]'));

    return read.success ? read.data : [];
  } catch {
    return [];
  }
};

/**
 * Which job runs somebody has pinned to the top of the list, kept in this browser so they are there
 * the next time, and there whichever view of the jobs is open.
 *
 * Only the most recent twenty are kept, since a run is forgotten by the server after a month and a
 * pin on one that is gone would only sit here for ever.
 *
 * @returns The ids of the pinned runs, the same set until one is pinned or unpinned so that what is
 *   built from it is not built afresh on every draw, and the way to pin or unpin one.
 */
const usePinnedJobRuns = (): {
  pinned: ReadonlySet<string>;
  toggle: (jobRunId: string) => void;
} => {
  const [ids, setIds] = useState(readPinned);

  const toggle = useCallback((jobRunId: string) => {
    setIds((was) => {
      const next = was.includes(jobRunId)
        ? was.filter((one) => one !== jobRunId)
        : [...was, jobRunId].slice(-MOST_KEPT);

      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        return next;
      }

      return next;
    });
  }, []);

  const pinned = useMemo(() => new Set(ids), [ids]);

  return { pinned, toggle };
};

export { usePinnedJobRuns };
