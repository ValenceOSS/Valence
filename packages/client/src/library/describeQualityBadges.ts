import { describeChannels } from '@ValenceCore/functions/describeTrack';

type WhatItIs = {
  width: number;
  height: number;
  videoRange: string;
  audioStreams?:
    | readonly {
        codec: string;
        channels: number;
        isAtmos: boolean;
        profile?: string | null | undefined;
      }[]
    | undefined;
};

const RANGE_NAMES: Readonly<Record<string, { short: string; whole: string }>> = {
  DolbyVision: { short: 'DV', whole: 'Dolby Vision' },
  HDR10Plus: { short: 'HDR10+', whole: 'HDR10+' },
  HDR10: { short: 'HDR10', whole: 'HDR10' },
  HLG: { short: 'HLG', whole: 'HLG' },
};

const SOUND_NAMES: Readonly<Record<string, { short: string; whole: string }>> = {
  truehd: { short: 'TrueHD', whole: 'Dolby TrueHD' },
  eac3: { short: 'DD+', whole: 'Dolby Digital+' },
  ac3: { short: 'DD', whole: 'Dolby Digital' },
};

const ATMOS = { short: 'Atmos', whole: 'Dolby Atmos' };

/**
 * The badges a title earns for how it looks and sounds, as a streaming service shows them beside
 * its facts: 4K, HD or SD; its dynamic range where it has one; and its best soundtrack's format and
 * channels — Atmos above everything, then whichever track has the most channels. Dolby's formats
 * go by the short names people know them by where room is tight, since the logos are Dolby's to
 * license, and by their whole names where there is room to spell them out.
 *
 * @param what - Its picture's size and range, and its soundtracks where they are known.
 * @param isSpelledOut - Whether to give Dolby's formats their whole names.
 * @returns The badges, in the order they read.
 */
const describeQualityBadges = (
  { width, height, videoRange, audioStreams }: WhatItIs,
  isSpelledOut = false,
): string[] => {
  const named = (name: { short: string; whole: string } | undefined): string | null =>
    name === undefined ? null : isSpelledOut ? name.whole : name.short;
  const size =
    width >= 3200 || height >= 1800 ? '4K' : width >= 1200 || height >= 700 ? 'HD' : 'SD';
  const best = [...(audioStreams ?? [])].sort(
    (left, right) => Number(right.isAtmos) - Number(left.isAtmos) || right.channels - left.channels,
  )[0];
  const sound =
    best === undefined
      ? null
      : best.isAtmos
        ? named(ATMOS)
        : best.codec === 'dts'
          ? best.profile?.includes('MA') === true
            ? 'DTS-HD MA'
            : 'DTS'
          : named(SOUND_NAMES[best.codec]);

  return [
    size,
    named(RANGE_NAMES[videoRange]),
    sound,
    best === undefined || best.channels <= 2 ? null : describeChannels(best.channels),
  ].filter((badge) => badge !== null);
};

export { describeQualityBadges };
