import { estimateDownloadBytes } from '@ValenceCore/functions/estimateDownloadBytes';
import { listAvailableQualitySteps } from '@ValenceCore/functions/listAvailableQualitySteps';
import { negotiatePlayback } from '@ValenceCore/functions/negotiatePlayback';
import { resolveQualityStep } from '@ValenceCore/functions/resolveQualityStep';
import { savesEnough } from '@ValenceCore/functions/savesEnough';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';

const BYTES_PER_KILOBIT_SECOND = 125;

type StepsThatSaveNothingOptions = {
  media: MediaItem;
  profile: DeviceProfile;
};

/**
 * Which smaller qualities would cost this device about as much as the original, or more, and so buy
 * a worse picture for nothing.
 *
 * @param options - The film, and what the device can play.
 * @returns The steps to show but not offer.
 */
const stepsThatSaveNothing = ({ media, profile }: StepsThatSaveNothingOptions): QualityStepId[] => {
  try {
    const whole = media.bitrateKbps * media.durationSeconds * BYTES_PER_KILOBIT_SECOND;
    const original = estimateDownloadBytes({
      plan: negotiatePlayback(media, profile, null),
      source: media,
      sizeBytes: whole,
    });

    if (original === null) {
      return [];
    }

    return listAvailableQualitySteps(media).filter((id) => {
      const bytes = estimateDownloadBytes({
        plan: negotiatePlayback(media, profile, resolveQualityStep(media, id)),
        source: media,
        sizeBytes: whole,
      });

      return bytes !== null && !savesEnough(bytes, original);
    });
  } catch {
    return [];
  }
};

export type { StepsThatSaveNothingOptions };

export { stepsThatSaveNothing };
