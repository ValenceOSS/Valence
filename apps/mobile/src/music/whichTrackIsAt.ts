import { AudioQualitySchema } from '@ValenceContracts/schemas/Music';
import type { AudioQuality } from '@ValenceContracts/schemas/Music';

const STREAMED = /\/api\/music\/tracks\/([0-9a-f-]{36})\/stream(?:\?quality=([a-z]+))?/;

const KEPT = /track-([0-9a-f-]{36})-/;

/**
 * Which track an address the music player handed its speaker is, and at what quality, so it can be
 * sent to a device being cast to — whether it is streamed from the server or kept on the phone, where
 * the device cannot reach it and is sent the server's high-quality encode instead.
 *
 * @param src - The address.
 * @returns The track and its quality, or nothing where it names no track.
 */
const whichTrackIsAt = (src: string): { trackId: string; quality: AudioQuality } | null => {
  const streamed = STREAMED.exec(src);

  if (streamed?.[1] !== undefined) {
    const quality = AudioQualitySchema.safeParse(streamed[2] ?? 'lossless');

    return { trackId: streamed[1], quality: quality.success ? quality.data : 'lossless' };
  }

  const kept = KEPT.exec(src);

  return kept?.[1] === undefined ? null : { trackId: kept[1], quality: 'high' };
};

export { whichTrackIsAt };
