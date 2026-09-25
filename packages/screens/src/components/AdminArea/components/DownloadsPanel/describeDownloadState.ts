import { docsFor } from '@ValenceCore/functions/docsFor';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { StateBadge } from '@ValenceClient/status/StateBadge';
import { STATUS_LOOK } from '@ValenceClient/status/STATUS_LOOK';
import { say } from '@ValenceI18n/say';

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
      return {
        ...STATUS_LOOK.working,
        label: say('admin.describeDownloadState.downloading'),
        detail: download.problem,
      };
    case 'stalled':
      return {
        ...STATUS_LOOK.attention,
        label: say('admin.describeDownloadState.stalled'),
        detail:
          download.problem ??
          (download.protocol === 'torrent'
            ? say('admin.describeDownloadState.nobodySending')
            : say('admin.describeDownloadState.nothingArriving')),
      };
    case 'paused':
      return {
        label: say('admin.describeDownloadState.paused'),
        tone: 'quiet',
        detail: download.problem,
      };
    case 'processing':
      return {
        ...STATUS_LOOK.working,
        label: say('admin.describeDownloadState.finishing'),
        detail:
          download.protocol === 'usenet'
            ? say('admin.describeDownloadState.checkingAndUnpacking')
            : say('admin.describeDownloadState.checking'),
      };
    case 'done':
      if (download.filedInto !== null) {
        return {
          ...STATUS_LOOK.done,
          detail: say('admin.describeDownloadState.filedInto', { library: download.filedInto }),
        };
      }

      return download.filingProblem === null
        ? { ...STATUS_LOOK.done, detail: download.problem }
        : {
            ...STATUS_LOOK.attention,
            label: say('admin.describeDownloadState.notFiled'),
            detail: download.filingProblem,
            help: docsFor(download.filingProblemCode),
          };
    case 'failed':
      return {
        ...STATUS_LOOK.failed,
        detail: download.problem ?? say('admin.describeDownloadState.failed'),
        help: docsFor(download.problemCode),
      };
  }
};

export { describeDownloadState };
