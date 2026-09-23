import { docsFor } from '@ValenceCore/functions/docsFor';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { StateBadge } from '@ValenceClient/status/StateBadge';
import { STATUS_LOOK } from '@ValenceClient/status/STATUS_LOOK';

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
      return { ...STATUS_LOOK.queued, detail: download.problem };
    case 'downloading':
      return { ...STATUS_LOOK.working, label: 'Downloading', detail: download.problem };
    case 'stalled':
      return {
        ...STATUS_LOOK.attention,
        label: 'Stalled',
        detail:
          download.problem ??
          (download.protocol === 'torrent' ? 'Nobody is sending it.' : 'Nothing is arriving.'),
      };
    case 'paused':
      return { label: 'Paused', tone: 'quiet', detail: download.problem };
    case 'processing':
      return {
        ...STATUS_LOOK.working,
        label: 'Finishing',
        detail: download.protocol === 'usenet' ? 'Checking and unpacking.' : 'Checking.',
      };
    case 'done':
      if (download.filedInto !== null) {
        return {
          ...STATUS_LOOK.done,
          detail: `Filed into ${download.filedInto}.`,
        };
      }

      return download.filingProblem === null
        ? { ...STATUS_LOOK.done, detail: download.problem }
        : {
            ...STATUS_LOOK.attention,
            label: 'Not filed',
            detail: download.filingProblem,
            help: docsFor(download.filingProblemCode),
          };
    case 'failed':
      return {
        ...STATUS_LOOK.failed,
        detail: download.problem ?? 'It failed.',
        help: docsFor(download.problemCode),
      };
  }
};

export { describeDownloadState };
