import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import { encodeBitrateFor } from './encodeBitrateFor';
import type { QualityClamp } from './resolveQualityStep';

type FallbackSource = {
  bitrateKbps: number;
  videoCodec: string;
  width: number;
  height: number;
};

/**
 * The ceiling for an H.264 encode of a film that was meant to be copied, should the media service
 * find it cannot be: reckoned the way every other encode is, against the codecs on both sides, at
 * the film's own size, and within every ceiling the copy was allowed under, the one the client
 * stated and the one a quality step sets, which a linked server's quality limit arrives as.
 *
 * @param item - The film being copied.
 * @param profile - What the client said it plays.
 * @param clamp - The quality step the copy was negotiated under, where there was one.
 * @returns The ceiling, in kilobits a second.
 */
const fallbackEncodeKbpsFor = (
  item: FallbackSource,
  profile: DeviceProfile,
  clamp: QualityClamp | null = null,
): number => {
  const ceilings = [profile.maxBitrateKbps, clamp?.maxVideoBitrateKbps].filter(
    (ceiling) => ceiling !== null && ceiling !== undefined,
  );

  return encodeBitrateFor({
    sourceBitrateKbps: item.bitrateKbps,
    sourceCodec: item.videoCodec,
    targetCodec: 'h264',
    ceilingKbps: ceilings.length === 0 ? null : Math.min(...ceilings),
    sourceWidth: item.width,
    sourceHeight: item.height,
    maxWidth: item.width,
    maxHeight: item.height,
  });
};

export { fallbackEncodeKbpsFor };
