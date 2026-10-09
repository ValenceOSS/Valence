import type { QueuedDownloadState } from '@ValenceContracts/schemas/DownloadQueue';
import { say } from '@ValenceI18n/say';

/**
 * What is keeping a download from coming, where something is: paused, stalled for want of anybody
 * to fetch it from, or failed in the download client. Nothing while it is coming or about to.
 *
 * @param state - Where the download client says it is.
 * @returns The word for it, or null.
 */
const describeDownloadHold = (state: QueuedDownloadState): string | null => {
  switch (state) {
    case 'paused':
      return say('common.paused');
    case 'stalled':
      return say('common.stalled');
    case 'failed':
      return say('common.failed');
    case 'queued':
    case 'metadata':
    case 'downloading':
    case 'processing':
    case 'done':
      return null;
  }
};

export { describeDownloadHold };
