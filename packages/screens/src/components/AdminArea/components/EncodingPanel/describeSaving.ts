import { formatBytes } from '@ValenceCore/functions/formatBytes';
import type { ReencodeMode } from '@ValenceContracts/schemas/Reencode';

type Saving = {
  mode: ReencodeMode;
  nowBytes: number;
  afterBytes: number;
};

/**
 * What a choice does to the disk, said as the direction it goes in.
 *
 * "Re-encode" reads as "saves space", and in one of the two modes it does the exact opposite: a
 * rendition kept beside the original costs disk to buy a household that never transcodes on a
 * Sunday evening. A figure that only ever went down would quietly mislead half the people using
 * this, so the word comes first and the number second.
 *
 * @param saving - Which mode, and the totals before and after.
 * @returns One phrase saying what changes.
 */
const describeSaving = ({ mode, nowBytes, afterBytes }: Saving): string => {
  const difference = afterBytes - nowBytes;

  if (difference === 0) {
    return 'Uses the same disk either way';
  }

  return difference < 0
    ? `Frees about ${formatBytes(-difference)}`
    : `Costs about ${formatBytes(difference)}${mode === 'keep' ? ', and buys a household that does not transcode' : ''}`;
};

export type { Saving };

export { describeSaving };
