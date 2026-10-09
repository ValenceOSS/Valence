import { partsOfVideoQuality } from '@ValenceContracts/functions/partsOfVideoQuality';
import { QUALITY_LABELS } from '@ValenceRequests/profiles/QUALITY_LABELS';
import { QUALITY_NAMES } from '@ValenceRequests/profiles/QUALITY_NAMES';
import { saying } from '@ValenceI18n/saying';
import type { VideoQualityId } from '@ValenceContracts/schemas/QualityProfile';
import type { Said } from '@ValenceI18n/SaidSchema';

/**
 * A combined video quality in words, such as "A web download at 1080p", or a cinema recording by
 * its source alone.
 *
 * @param id - The quality.
 * @returns Its name.
 */
const nameVideoQuality = (id: VideoQualityId): Said => {
  const { source, resolution } = partsOfVideoQuality(id);

  return resolution === null
    ? QUALITY_NAMES[source]
    : saying('requests.profiles.qualityNames.sourceAtResolution', {
        source: QUALITY_NAMES[source],
        resolution: QUALITY_LABELS[resolution],
      });
};

export { nameVideoQuality };
