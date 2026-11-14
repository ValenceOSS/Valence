import type { VideoRange } from '@ValenceContracts/schemas/MediaItem';

const RANGES: Readonly<Record<string, VideoRange>> = {
  SDR: 'SDR',
  HDR10: 'HDR10',
  HDR10Plus: 'HDR10Plus',
  HLG: 'HLG',
  DOVI: 'DolbyVision',
  DOVIWithHDR10: 'DolbyVision',
  DOVIWithHLG: 'DolbyVision',
  DOVIWithSDR: 'DolbyVision',
};

/**
 * The dynamic range Valence calls what Jellyfin names a picture's range type.
 *
 * @param rangeType - Jellyfin's name for it, where it gave one.
 * @returns Valence's name, which is standard dynamic range where Jellyfin's is unknown.
 */
const videoRangeOfJellyfin = (rangeType: string | null | undefined): VideoRange =>
  RANGES[rangeType ?? 'SDR'] ?? 'SDR';

export { videoRangeOfJellyfin };
