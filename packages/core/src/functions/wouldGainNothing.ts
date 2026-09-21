import { estimateReencodeBytes } from '@ValenceCore/functions/estimateReencodeBytes';
import { resolveQualityStep } from '@ValenceCore/functions/resolveQualityStep';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';

const WORTH_DOING = 0.9;

/**
 * Whether re-encoding this file on these settings would achieve nothing, and so should be refused
 * rather than silently performed.
 *
 * Re-encoding something already at or below the target is pure loss for no gain: a generation of
 * quality is discarded and the same bytes come back. The two modes fail that test differently,
 * because they are asking for opposite things.
 *
 * **Replacing** is asking for the file to get smaller, so the test is whether it would — by enough
 * to be worth a generation, which a tenth is not. Asking the estimate rather than reasoning about
 * rungs and codecs separately is what makes it right in the awkward cases: the same rung in a more
 * efficient codec is a real saving and is allowed, and the same rung in the same codec is not and
 * is not.
 *
 * **Keeping alongside** is not asking for anything to get smaller — it is asking for a file some
 * device can play without work. So the test is whether it would differ from the original at all:
 * the same picture in the same codec is a second copy of what is already there.
 *
 * @param item - The file, as the catalogue holds it.
 * @param settings - What was chosen.
 * @returns Whether the work would buy nothing.
 */
const wouldGainNothing = (item: MediaItem, settings: ReencodeSettings): boolean => {
  if (settings.mode === 'keep') {
    const clamps = settings.quality !== null && resolveQualityStep(item, settings.quality) !== null;

    return !clamps && (settings.videoCodec === null || settings.videoCodec === item.videoCodec);
  }

  const estimated = estimateReencodeBytes(item, settings);

  if (estimated === null || typeof item.sizeBytes !== 'number' || item.sizeBytes <= 0) {
    return false;
  }

  return estimated > item.sizeBytes * WORTH_DOING;
};

export { wouldGainNothing };
