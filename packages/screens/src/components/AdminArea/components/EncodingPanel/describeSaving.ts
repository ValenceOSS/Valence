import { formatBytes } from '@ValenceCore/functions/formatBytes';
import type { ReencodeMode } from '@ValenceContracts/schemas/Reencode';
import { say } from '@ValenceI18n/say';

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
    return say('screens.encodingPanel.describeSaving.usesTheSameDiskEitherWay');
  }

  return difference < 0
    ? say('screens.encodingPanel.describeSaving.freesAboutValue', {
        value: formatBytes(-difference),
      })
    : say(
        mode === 'keep'
          ? 'screens.encodingPanel.describeSaving.costsAboutValueAndBuys'
          : 'screens.encodingPanel.describeSaving.costsAboutValue',
        { value: formatBytes(difference) },
      );
};

export type { Saving };

export { describeSaving };
