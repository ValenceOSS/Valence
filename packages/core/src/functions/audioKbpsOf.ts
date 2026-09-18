import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

const LOSSLESS_KBPS_PER_CHANNEL: Record<string, number> = {
  truehd: 600,
  mlp: 600,
  dtshd: 550,
  flac: 450,
  alac: 450,
  pcm: 1152,
};

const COMPRESSED_KBPS_BY_CHANNELS = [
  { atOrBelow: 2, kbps: 192 },
  { atOrBelow: 6, kbps: 448 },
] as const;

const WIDE_COMPRESSED_KBPS = 768;

/**
 * Roughly what a track costs per second.
 *
 * A figure has to be implied rather than read: ffprobe reports no per-track bitrate for most
 * containers, so all there is to go on is the codec and the channel count. Lossless codecs are
 * weighed per channel, where the arithmetic genuinely holds; everything else falls back to what a
 * track of that width is usually given.
 *
 * Biased high, as every estimate here is — somebody told four gigabytes who receives three is
 * pleased, and somebody told three who receives four has hit the exact problem the figure exists to
 * prevent.
 *
 * @param stream - The track.
 * @returns Its bitrate in kbps.
 */
const audioKbpsOf = (stream: AudioStream): number => {
  const perChannel = LOSSLESS_KBPS_PER_CHANNEL[stream.codec];

  if (perChannel !== undefined) {
    return perChannel * stream.channels;
  }

  return (
    COMPRESSED_KBPS_BY_CHANNELS.find((step) => stream.channels <= step.atOrBelow)?.kbps ??
    WIDE_COMPRESSED_KBPS
  );
};

export { LOSSLESS_KBPS_PER_CHANNEL, audioKbpsOf };
