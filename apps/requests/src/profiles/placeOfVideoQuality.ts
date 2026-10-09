import { partsOfVideoQuality } from '@ValenceContracts/functions/partsOfVideoQuality';
import { videoQualityIdOf } from '@ValenceContracts/functions/videoQualityIdOf';
import type { ParsedRelease } from '@ValenceContracts/schemas/ParsedRelease';
import type { VideoQualityId } from '@ValenceContracts/schemas/QualityProfile';

/**
 * Where a video comes in a profile's list of qualities, best first: the place of the quality its
 * source and resolution make, or where its name gives no source, the place of the lowest quality
 * the list takes at its resolution. Nothing where the list does not take it.
 *
 * @param parsed - What its name says.
 * @param qualities - The profile's qualities, best first.
 * @returns Its place, from nought, or null.
 */
const placeOfVideoQuality = (
  parsed: Pick<ParsedRelease, 'source' | 'resolution'>,
  qualities: readonly VideoQualityId[],
): number | null => {
  const id = videoQualityIdOf(parsed.source, parsed.resolution);
  const place =
    id !== null
      ? qualities.indexOf(id)
      : parsed.resolution === null
        ? -1
        : qualities.findLastIndex(
            (quality) => partsOfVideoQuality(quality).resolution === parsed.resolution,
          );

  return place === -1 ? null : place;
};

export { placeOfVideoQuality };
