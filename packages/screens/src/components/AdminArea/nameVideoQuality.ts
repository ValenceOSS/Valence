import { partsOfVideoQuality } from '@ValenceContracts/functions/partsOfVideoQuality';
import { QUALITY_NAMES } from '@ValenceScreens/components/AdminArea/QUALITY_NAMES';
import type { VideoQualityId } from '@ValenceContracts/schemas/QualityProfile';

/**
 * A combined video quality as the admin area writes it, such as "WEB-DL 1080p", or a cinema
 * recording by its source alone.
 *
 * @param id - The quality.
 * @returns Its name.
 */
const nameVideoQuality = (id: VideoQualityId): string => {
  const { source, resolution } = partsOfVideoQuality(id);

  return resolution === null
    ? QUALITY_NAMES[source]
    : `${QUALITY_NAMES[source]} ${QUALITY_NAMES[resolution]}`;
};

export { nameVideoQuality };
