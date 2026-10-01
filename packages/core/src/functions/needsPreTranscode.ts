import { resolveQualityStep } from '@ValenceCore/functions/resolveQualityStep';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';
import type { ReencodeCodec } from '@ValenceContracts/schemas/Reencode';

const CODECS_STILL_WIDELY_DECODED: ReadonlySet<string> = new Set(['h264', 'hevc', 'av1']);

type PreTranscodeTarget = {
  quality: QualityStepId;
  videoCodec: ReencodeCodec;
  maxBitrateKbps: number | null;
};

/**
 * Whether a file is bigger than the copy pre-transcoding would make of it, so that making one buys
 * something: a taller picture or more bits than the target allows, or a codec the target trades for
 * one more devices decode. A copy is never made larger than its original, and never the same thing
 * twice.
 *
 * @param item - The file's picture, as the catalogue holds it.
 * @param target - What pre-transcoding makes copies as.
 * @returns Whether a copy would differ from the original in a way that helps.
 */
const needsPreTranscode = (
  item: Pick<MediaItem, 'height' | 'bitrateKbps' | 'videoCodec' | 'videoFrameRate'>,
  target: PreTranscodeTarget,
): boolean => {
  if (resolveQualityStep(item, target.quality) !== null) {
    return true;
  }

  if (target.maxBitrateKbps !== null && item.bitrateKbps > target.maxBitrateKbps) {
    return true;
  }

  const codec = item.videoCodec.toLowerCase();

  return (
    codec !== target.videoCodec &&
    (target.videoCodec === 'h264' || !CODECS_STILL_WIDELY_DECODED.has(codec))
  );
};

export type { PreTranscodeTarget };

export { needsPreTranscode };
