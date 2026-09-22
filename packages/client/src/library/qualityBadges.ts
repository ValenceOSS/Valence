import { describeChannels } from '@ValenceCore/functions/describeTrack';
import { sharpestStepOf } from '@ValenceCore/functions/sharpestStepOf';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';

type AudioStreamFacts = Pick<
  MediaItem['audioStreams'][number],
  'codec' | 'channels' | 'isAtmos'
> & {
  profile?: string | null | undefined;
};

const HIGH_DEFINITION: ReadonlySet<string> = new Set(['1440p', '1080p', '720p']);

const RANGES: Readonly<Record<string, string>> = {
  DolbyVision: 'Dolby Vision',
  HDR10Plus: 'HDR10+',
  HDR10: 'HDR10',
  HLG: 'HLG',
};

const SOUNDS: Readonly<Record<string, string>> = {
  truehd: 'Dolby TrueHD',
  eac3: 'Dolby Digital+',
  ac3: 'Dolby Digital',
};

/**
 * The badges a title earns for how it looks and sounds, as a streaming service shows them beside
 * its facts.
 *
 * Its sharpness is 4K, HD or SD by the sharpest quality step its picture reaches, so a widescreen
 * film is judged by its width. Its dynamic range follows where it has one. Its soundtrack is the
 * richest it has: Dolby Atmos on its own where there is Atmos, since that says more than a channel
 * count; otherwise the format by name, Dolby Digital+ or DTS-HD MA, and its channels, 5.1 or 7.1.
 * Stereo is left unsaid, since everything has it.
 *
 * Names are given whole; a client short of room shortens them itself.
 *
 * @param item - Its picture's size and range, and its soundtracks where they are known.
 * @returns The badges, in the order they read.
 */
const qualityBadges = (
  item: Pick<MediaItem, 'width' | 'height'> & {
    videoRange: string;
    audioStreams?: readonly AudioStreamFacts[] | undefined;
  },
): string[] => {
  const step = sharpestStepOf(item);
  const sharpness =
    step === null ? null : step.id === '2160p' ? '4K' : HIGH_DEFINITION.has(step.id) ? 'HD' : 'SD';
  const richest = [...(item.audioStreams ?? [])].sort(
    (left, right) => Number(right.isAtmos) - Number(left.isAtmos) || right.channels - left.channels,
  )[0];
  const sound =
    richest === undefined
      ? []
      : richest.isAtmos
        ? ['Dolby Atmos']
        : [
            richest.codec === 'dts'
              ? richest.profile?.includes('MA') === true
                ? 'DTS-HD MA'
                : 'DTS'
              : (SOUNDS[richest.codec] ?? null),
            richest.channels > 2 ? describeChannels(richest.channels) : null,
          ];

  return [sharpness, RANGES[item.videoRange] ?? null, ...sound].filter((badge) => badge !== null);
};

export { qualityBadges };
