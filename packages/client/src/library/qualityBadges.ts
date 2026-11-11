import { describeRange } from '@ValenceClient/library/describeRange';
import { sharpnessOf } from '@ValenceClient/library/sharpnessOf';
import { soundOf } from '@ValenceClient/library/soundOf';
import type { AudioStreamFacts } from '@ValenceClient/library/soundOf.types';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';

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
  const richest = [...(item.audioStreams ?? [])].sort(
    (left, right) => Number(right.isAtmos) - Number(left.isAtmos) || right.channels - left.channels,
  )[0];
  const { format, channels } = soundOf(richest);

  return [sharpnessOf(item), describeRange(item.videoRange), format, channels].filter(
    (badge) => badge !== null,
  );
};

export { qualityBadges };
