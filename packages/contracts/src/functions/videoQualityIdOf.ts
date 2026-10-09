import { VIDEO_QUALITY_IDS } from '@ValenceContracts/schemas/QualityProfile';
import type { ReleaseSource, Resolution } from '@ValenceContracts/schemas/ParsedRelease';
import type { VideoQualityId } from '@ValenceContracts/schemas/QualityProfile';

/**
 * The combined quality a video's source and resolution make, such as `webdl-1080p`; a recording
 * made in a cinema whatever its resolution; nothing where either is not known, or the two make no
 * quality there is, such as a 720p remux.
 *
 * @param source - Where it came from.
 * @param resolution - Its resolution.
 * @returns The quality, or null.
 */
const videoQualityIdOf = (
  source: ReleaseSource | null,
  resolution: Resolution | null,
): VideoQualityId | null => {
  if (source === 'telesync' || source === 'cam') {
    return source;
  }

  const id = source === null || resolution === null ? null : `${source}-${resolution}`;

  return VIDEO_QUALITY_IDS.find((one) => one === id) ?? null;
};

export { videoQualityIdOf };
