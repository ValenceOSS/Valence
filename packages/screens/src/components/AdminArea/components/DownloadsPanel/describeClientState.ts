import type { DownloadClientState } from '@ValenceContracts/schemas/DownloadQueue';
import type { StateBadge } from '@ValenceClient/status/StateBadge';

/**
 * Says how a download client is, as a badge and the line beneath it: switched off, not asked yet,
 * out of reach and why, or answering.
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
    return { label: 'Off', tone: 'quiet', detail: null };
  }

  if (reading === undefined || reading.checkedAt === null) {
    return { label: 'Not asked yet', tone: 'quiet', detail: null };
  }

  return reading.isReachable
    ? { label: 'Answering', tone: 'success', detail: null }
    : { label: 'Unreachable', tone: 'danger', detail: reading.problem };
};

export { describeClientState };
