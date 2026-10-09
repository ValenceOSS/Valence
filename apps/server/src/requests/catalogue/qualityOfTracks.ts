import type { MusicQuality } from '@ValenceContracts/schemas/ParsedRelease';

type HeldTrack = { codec: string; isLossless: boolean; bitDepth: number | null };

const LOSSY: Readonly<Record<string, MusicQuality>> = { aac: 'aac', opus: 'opus' };

/**
 * Where an album the library holds stands among the qualities music is fetched at, from its
 * tracks: lossless only where every track is, 24-bit where every one is that deep, and otherwise at
 * the commonest lossy codec, an MP3 of no known bitrate counting at the bottom.
 *
 * @param tracks - Each track's codec, whether it is lossless, and its bit depth.
 * @returns The quality.
 */
const qualityOfTracks = (tracks: readonly HeldTrack[]): MusicQuality => {
  if (tracks.length > 0 && tracks.every((track) => track.isLossless)) {
    return tracks.every((track) => track.codec.toLowerCase() === 'alac')
      ? 'alac'
      : tracks.every((track) => (track.bitDepth ?? 0) >= 24)
        ? 'flac24'
        : 'flac';
  }

  const counted = new Map<MusicQuality, number>();

  for (const track of tracks.filter((one) => !one.isLossless)) {
    const quality = LOSSY[track.codec.toLowerCase()] ?? 'mp3';

    counted.set(quality, (counted.get(quality) ?? 0) + 1);
  }

  return [...counted].toSorted((left, right) => right[1] - left[1])[0]?.[0] ?? 'mp3';
};

export { qualityOfTracks };
