import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { StateBadge } from '@ValenceScreens/components/AdminArea/StateBadge';

/**
 * Says how a download is, as a badge and the line beneath it, with the client's own reason
 * wherever it gave one — and once it has finished, where it was filed, or why it could not be.
 *
 * @param download - The download.
 * @returns The badge's words and tone, and the reason where there is one.
 */
const describeDownloadState = (download: QueuedDownload): StateBadge => {
  switch (download.state) {
    case 'queued':
      return { label: 'Queued', tone: 'quiet', detail: download.problem };
    case 'downloading':
      return { label: 'Downloading', tone: 'busy', detail: download.problem };
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
      if (download.filedInto !== null) {
        return {
          label: 'Completed',
          tone: 'success',
          detail: `Filed into ${download.filedInto}.`,
        };
      }

      return download.filingProblem === null
        ? { label: 'Done', tone: 'success', detail: download.problem }
        : { label: 'Not filed', tone: 'warning', detail: download.filingProblem };
    case 'failed':
      return { label: 'Failed', tone: 'danger', detail: download.problem ?? 'It failed.' };
  }
};

export { describeDownloadState };
