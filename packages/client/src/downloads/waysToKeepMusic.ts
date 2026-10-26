import {
  AUDIO_QUALITIES,
  AUDIO_QUALITY_DETAILS,
  AUDIO_QUALITY_KBPS,
  AUDIO_QUALITY_LABELS,
} from '@ValenceContracts/schemas/Music';
import type { AudioQuality, MusicTrack } from '@ValenceContracts/schemas/Music';

type WayToKeepMusic = {
  quality: AudioQuality;
  label: string;
  detail: string;
  bytes: number | null;
};

/**
 * How many bytes some songs come to at a bit rate.
 *
 * @param kbps - The bit rate.
 * @param seconds - How long they run.
 * @returns The bytes.
 */
const bytesAt = (kbps: number, seconds: number): number => Math.round((kbps * 1000 * seconds) / 8);

/**
 * The qualities some songs can be downloaded at, each with roughly how much room it takes.
 *
 * @param tracks - The songs.
 * @returns Each quality, best first, with its size where it can be told.
 */
const waysToKeepMusic = (
  tracks: readonly Pick<MusicTrack, 'durationSeconds' | 'bitrateKbps'>[],
): WayToKeepMusic[] => {
  const seconds = tracks.reduce((sum, track) => sum + track.durationSeconds, 0);
  const isEveryRateKnown = tracks.every((track) => track.bitrateKbps !== null);
  const lossless = tracks.reduce(
    (sum, track) => sum + bytesAt(track.bitrateKbps ?? 0, track.durationSeconds),
    0,
  );

  return AUDIO_QUALITIES.map((quality) => ({
    quality,
    label: AUDIO_QUALITY_LABELS[quality],
    detail: AUDIO_QUALITY_DETAILS[quality],
    bytes:
      quality === 'lossless'
        ? isEveryRateKnown
          ? lossless
          : null
        : bytesAt(AUDIO_QUALITY_KBPS[quality], seconds),
  }));
};

export type { WayToKeepMusic };

export { waysToKeepMusic };
