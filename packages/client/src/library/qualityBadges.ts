import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';

const UHD_WIDTH = 3000;

const HD_WIDTH = 1200;

const RANGES: Partial<Record<MediaItem['videoRange'], string>> = {
  DolbyVision: 'Dolby Vision',
  HDR10: 'HDR10',
  HDR10Plus: 'HDR10+',
  HLG: 'HLG',
};

/**
 * What a title's file is, as the short badges a title page shows beside its year: how sharp it is,
 * the range its colour is in, and the most channels its sound has.
 *
 * @param item - The title's file.
 * @returns The badges, sharpest first, leaving out what there is nothing to say about.
 */
const qualityBadges = (
  item: Pick<MediaItem, 'width' | 'videoRange' | 'audioStreams'>,
): string[] => {
  const sharpness = item.width >= UHD_WIDTH ? '4K' : item.width >= HD_WIDTH ? 'HD' : null;
  const range = RANGES[item.videoRange] ?? null;
  const loudest = item.audioStreams.reduce(
    (best, stream) => (stream.channels > best.channels ? stream : best),
    { channels: 0, isAtmos: false },
  );
  const sound = loudest.isAtmos
    ? 'Atmos'
    : loudest.channels >= 8
      ? '7.1'
      : loudest.channels >= 6
        ? '5.1'
        : null;

  return [sharpness, range, sound].filter((badge) => badge !== null);
};

export { qualityBadges };
