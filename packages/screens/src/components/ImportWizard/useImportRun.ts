import { useEffect, useState } from 'react';
import { fetchImportRun } from '@ValenceClient/imports/fetchImportRun';
import type { MediaImportRun } from '@ValenceContracts/schemas/MediaImport';

const EVERY_MILLISECONDS = 1000;

/**
 * Follows an import while it plans or runs, reading it again every second until it settles.
 *
 * @param started - The import as it was when it started, or null where there is none.
 * @returns The import as it stands now.
 */
const useImportRun = (started: MediaImportRun | null): MediaImportRun | null => {
  const [run, setRun] = useState(started);
  const id = run?.id ?? null;
  const isMoving = run?.state === 'planning' || run?.state === 'importing';

  useEffect(() => {
    setRun(started);
  }, [started]);

  useEffect(() => {
    if (id === null || !isMoving) {
      return undefined;
    }

    let isLive = true;
    const timer = setInterval(() => {
      void fetchImportRun(id).then((answer) => {
        if (isLive && answer.kind === 'answered') {
          setRun(answer.value);
        }
      });
    }, EVERY_MILLISECONDS);

    return () => {
      isLive = false;
      clearInterval(timer);
    };
  }, [id, isMoving]);

  return run;
};

export { useImportRun };
