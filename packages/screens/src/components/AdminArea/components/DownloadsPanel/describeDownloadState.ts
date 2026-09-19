import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { StateBadge } from '@ValenceScreens/components/AdminArea/StateBadge';

/**
 * Says how a download is, as a badge and the line beneath it, with the client's own reason
 * wherever it gave one.
 *
 * @param download - The download.
 * @returns The badge's words and tone, and the reason where there is one.
 */
const describeDownloadState = (download: QueuedDownload): StateBadge => {
  switch (download.state) {
    case 'queued':
      return { label: 'Queued', tone: 'quiet', detail: download.problem };
    case 'downloading':
      return { label: 'Downloading', tone: 'accent', detail: download.problem };
    case 'stalled':
      return {
        label: 'Stalled',
        tone: 'warning',
        detail:
          download.problem ??
          (download.protocol === 'torrent' ? 'Nobody is sending it.' : 'Nothing is arriving.'),
      };
    case 'paused':
      return { label: 'Paused', tone: 'quiet', detail: download.problem };
    case 'processing':
      return {
        label: 'Finishing',
        tone: 'highlight',
        detail: download.protocol === 'usenet' ? 'Checking and unpacking.' : 'Checking.',
      };
    case 'done':
      return { label: 'Done', tone: 'success', detail: download.problem };
    case 'failed':
      return { label: 'Failed', tone: 'danger', detail: download.problem ?? 'It failed.' };
  }
};

export { describeDownloadState };
