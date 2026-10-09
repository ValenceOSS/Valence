import { RELEASE_SOURCES, RESOLUTIONS } from '@ValenceContracts/schemas/ParsedRelease';
import type { ReleaseSource, Resolution } from '@ValenceContracts/schemas/ParsedRelease';
import type { VideoQualityId } from '@ValenceContracts/schemas/QualityProfile';

/**
 * The source and resolution a combined quality stands for; a cinema recording has no resolution.
 *
 * @param id - The quality, such as `webdl-1080p`.
 * @returns Its source and resolution.
 */
const partsOfVideoQuality = (
  id: VideoQualityId,
): { source: ReleaseSource; resolution: Resolution | null } => {
  const [sourcePart, resolutionPart] = id.split('-');

  return {
    source: RELEASE_SOURCES.find((one) => one === sourcePart) ?? 'webdl',
    resolution: RESOLUTIONS.find((one) => one === resolutionPart) ?? null,
  };
};

export { partsOfVideoQuality };
