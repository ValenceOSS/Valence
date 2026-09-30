import { sayAgain } from '@ValenceI18n/sayAgain';
import { docsFor } from '@ValenceCore/functions/docsFor';
import type { DownloadClientState } from '@ValenceContracts/schemas/DownloadQueue';
import type { StateBadge } from '@ValenceClient/status/StateBadge';
import { say } from '@ValenceI18n/say';

/**
 * Says how a download client is, as a badge and the line beneath it: switched off, not asked yet,
 * offline and why, or online.
 *
 * @param isEnabled - Whether it is switched on.
 * @param reading - What the queue last heard from it, where it has heard anything.
 * @returns The badge's words and tone, and the reason where there is one.
 */
const describeClientState = (
  isEnabled: boolean,
  reading: DownloadClientState | undefined,
): StateBadge => {
  if (!isEnabled) {
    return { label: say('common.off'), tone: 'quiet', detail: null };
  }

  if (reading === undefined || reading.checkedAt === null) {
    return {
      label: say('screens.downloadsPanel.describeClientState.notAskedYet'),
      tone: 'quiet',
      detail: null,
    };
  }

  return reading.isReachable
    ? { label: say('common.online'), tone: 'success', detail: null }
    : {
        label: say('common.offline'),
        tone: 'danger',
        detail: reading.problem === null ? null : sayAgain(reading.problem),
        help: docsFor(reading.problemCode),
      };
};

export { describeClientState };
