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

const RANGE_NAMES: Readonly<Record<string, string>> = {
  DolbyVision: 'Dolby Vision',
  HDR10Plus: 'HDR10+',
  HDR10: 'HDR10',
  HLG: 'HLG',
};

const SOUND_NAMES: Readonly<Record<string, string>> = {
  truehd: 'Dolby TrueHD',
  eac3: 'Dolby Digital+',
  ac3: 'Dolby Digital',
};

/**
 * The badges a title earns for how it looks and sounds, as a streaming service shows them beside
 * its facts: 4K, HD or SD; its dynamic range where it has one; and its best soundtrack's format and
 * channels — Atmos above everything, then whichever track has the most channels.
 *
 * @param what - Its picture's size and range, and its soundtracks where they are known.
 * @returns The badges, in the order they read.
 */
const describeQualityBadges = ({ width, height, videoRange, audioStreams }: WhatItIs): string[] => {
  const size =
    width >= 3200 || height >= 1800 ? '4K' : width >= 1200 || height >= 700 ? 'HD' : 'SD';
  const best = [...(audioStreams ?? [])].sort(
    (left, right) => Number(right.isAtmos) - Number(left.isAtmos) || right.channels - left.channels,
  )[0];
  const sound =
    best === undefined
      ? null
      : best.isAtmos
        ? 'Dolby Atmos'
        : best.codec === 'dts'
          ? best.profile?.includes('MA') === true
            ? 'DTS-HD MA'
            : 'DTS'
          : (SOUND_NAMES[best.codec] ?? null);

  return [
    size,
    RANGE_NAMES[videoRange] ?? null,
    sound,
    best === undefined || best.channels <= 2 ? null : describeChannels(best.channels),
  ].filter((badge) => badge !== null);
};

export { describeQualityBadges };
