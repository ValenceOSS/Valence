import { sayAgainIfAny } from '@ValenceI18n/sayAgainIfAny';
import { sayAgain } from '@ValenceI18n/sayAgain';
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
      return {
        ...STATUS_LOOK.queued,
        detail: download.problem === null ? null : sayAgain(download.problem),
      };
    case 'metadata':
      return download.seeds === 0
        ? {
            ...STATUS_LOOK.attention,
            label: say('screens.downloadsPanel.describeDownloadState.fetchingMetadata'),
            detail:
              sayAgainIfAny(download.problem) ??
              say('screens.downloadsPanel.describeDownloadState.nobodyIsSharingItYet'),
          }
        : {
            ...STATUS_LOOK.working,
            label: say('screens.downloadsPanel.describeDownloadState.fetchingMetadata'),
            detail:
              sayAgainIfAny(download.problem) ??
              say('screens.downloadsPanel.describeDownloadState.learningWhatFilesItHolds'),
          };
    case 'downloading':
      return {
        ...STATUS_LOOK.working,
        label: say('common.downloading'),
        detail: download.problem === null ? null : sayAgain(download.problem),
      };
    case 'stalled':
      return {
        ...STATUS_LOOK.attention,
        label: say('common.stalled'),
        detail:
          sayAgainIfAny(download.problem) ??
          (download.protocol === 'torrent'
            ? say('screens.downloadsPanel.describeDownloadState.nobodyIsSendingIt')
            : say('screens.downloadsPanel.describeDownloadState.nothingIsArriving')),
      };
    case 'paused':
      return {
        label: say('common.paused'),
        tone: 'quiet',
        detail: download.problem === null ? null : sayAgain(download.problem),
      };
    case 'processing':
      return {
        ...STATUS_LOOK.working,
        label: say('screens.downloadsPanel.describeDownloadState.finishing'),
        detail:
          download.protocol === 'usenet'
            ? say('screens.downloadsPanel.describeDownloadState.checkingAndUnpacking')
            : say('screens.downloadsPanel.describeDownloadState.checking'),
      };
    case 'done':
      if (download.filedInto !== null) {
        return {
          ...STATUS_LOOK.done,
          detail: say('screens.downloadsPanel.describeDownloadState.filedIntoFiledInto', {
            filedInto: download.filedInto,
          }),
        };
      }

      return download.filingProblem === null
        ? {
            ...STATUS_LOOK.done,
            detail: download.problem === null ? null : sayAgain(download.problem),
          }
        : {
            ...STATUS_LOOK.attention,
            label: say('screens.importWizard.arrImportStep.notBroughtAcross'),
            detail: sayAgain(download.filingProblem),
            help: docsFor(download.filingProblemCode),
          };
    case 'failed':
      return {
        ...STATUS_LOOK.failed,
        detail: sayAgainIfAny(download.problem) ?? say('common.itFailed'),
        help: docsFor(download.problemCode),
      };
  }
};

export { describeDownloadState };
