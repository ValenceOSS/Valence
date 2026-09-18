import { AUDIO_QUALITY_KBPS } from '@ValenceContracts/schemas/Music';
import type { AudioQuality } from '@ValenceContracts/schemas/Music';
import type { TrackFile } from './MusicService';

type Rendition = { kind: 'original' } | { kind: 'encoded'; kbps: 96 | 160 | 320 };

const ROOM = 1.1;

/**
 * Decides what to send for a track at a quality somebody chose.
 *
 * Lossless sends the file as it is. Anything lower is an AAC encode at that bitrate — unless the
 * file is already lossy and no bigger than that, in which case encoding it again would only make it
 * worse and no smaller, so the file goes as it is.
 *
 * @param file - The track as it is on the disk.
 * @param quality - What was asked for.
 * @returns Whether to send the file or an encode of it, and at what bitrate.
 */
const renditionFor = (file: TrackFile, quality: AudioQuality): Rendition => {
  if (quality === 'lossless') {
    return { kind: 'original' };
  }

  const kbps = AUDIO_QUALITY_KBPS[quality];
  const isSmallEnough =
    !file.isLossless && file.bitrateKbps !== null && file.bitrateKbps <= kbps * ROOM;

  return isSmallEnough ? { kind: 'original' } : { kind: 'encoded', kbps };
};

export type { Rendition };

export { renditionFor };
