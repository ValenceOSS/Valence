import { useEffect, useState } from 'react';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { readScanState } from '@ValenceClient/library/fetchLibrary';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import type { ScanFollowerProps } from './ScanFollower.types';

type Seen = {
  state: string;
  phase: string | null;
  processed: number | null;
  total: number | null;
};

const EVERY_MILLISECONDS = 1000;

const SETTLED = new Set(['completed', 'failed', 'unknown']);

/**
 * Follows the scan of one library made for an import, live, until it finishes.
 *
 * @param jobId - The scan.
 * @param name - The library's name.
 * @param onSettled - Told once the scan has finished, one way or another.
 */
const ScanFollower = ({ jobId, name, onSettled }: ScanFollowerProps) => {
  const [seen, setSeen] = useState<Seen>({
    state: 'queued',
    phase: null,
    processed: null,
    total: null,
  });
  const isSettled = SETTLED.has(seen.state);

  useEffect(() => {
    if (isSettled) {
      onSettled(jobId);

      return undefined;
    }

    let isLive = true;
    const timer = setInterval(() => {
      void readScanState(jobId)
        .then((read) => {
          if (isLive) {
            setSeen({
              state: read.state,
              phase: read.phase === null ? null : sayAgain(read.phase),
              processed: read.processed,
              total: read.total,
            });
          }
        })
        .catch(() => undefined);
    }, EVERY_MILLISECONDS);

    return () => {
      isLive = false;
      clearInterval(timer);
    };
  }, [jobId, isSettled, onSettled]);

  const fraction =
    seen.processed === null || seen.total === null || seen.total === 0
      ? null
      : Math.round((seen.processed / seen.total) * 100);

  return (
    <div className="flex flex-col gap-2">
      <span className="truncate text-xs text-text-muted">
        {seen.state === 'completed'
          ? say('screens.importWizard.scanFollower.scanned')
          : seen.state === 'failed'
            ? say('screens.importWizard.scanFollower.theScanFailed')
            : (seen.phase ?? say('common.queued'))}
      </span>

      <ProgressBar
        isFull
        label={say('screens.importWizard.scanFollower.scanningName', { name })}
        value={seen.state === 'completed' ? 100 : fraction}
        max={100}
      />
    </div>
  );
};

ScanFollower.displayName = 'ScanFollower';

export { ScanFollower };
