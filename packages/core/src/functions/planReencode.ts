import { compressedAudioFor } from '@ValenceCore/functions/compressedAudioFor';
import { isLosslessAudio } from '@ValenceCore/functions/isLosslessAudio';
import { reencodeBitrateFor } from '@ValenceCore/functions/reencodeBitrateFor';
import { resolveQualityStep } from '@ValenceCore/functions/resolveQualityStep';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';

type ReencodeVideo =
  | { kind: 'copy' }
  | {
      kind: 'encode';
      codec: string;
      maxWidth: number;
      maxHeight: number;
      maxBitrateKbps: number;
    };

type ReencodeAudioTrack =
  | { kind: 'copy'; index: number }
  | { kind: 'encode'; index: number; codec: string; channels: number; maxBitrateKbps: number };

type ReencodePlan = {
  video: ReencodeVideo;
  audioTracks: ReencodeAudioTrack[];
  subtitleIndexes: number[];
};

/**
 * Turns what an administrator chose into the concrete encode a file needs.
 *
 * Two things are decided here rather than at the edge, because both are questions about this file
 * and not about the choice. The bitrate is a ceiling rather than a target — the encoder is left on
 * constant quality, which is what storage wants and streaming does not — and it never exceeds what
 * the source itself spends, since re-encoding a nine megabit file at fifteen buys nothing that was
 * not already thrown away. And every audio track is decided one at a time, so a 7.1 lossless track
 * and a stereo commentary are not both forced through the same encoder at the same channel count,
 * which is what a single `-c:a` would do.
 *
 * Every subtitle track is carried, always. The container never changes, so there is nothing a
 * subtitle track could be that the destination cannot hold.
 *
 * @param item - The file, as the catalogue holds it.
 * @param settings - What was chosen: replacing, keeping alongside, or audio alone.
 * @returns What to encode, what to copy, and what to carry.
 */
const planReencode = (item: MediaItem, settings: ReencodeSettings): ReencodePlan => {
  const clamp = settings.quality === null ? null : resolveQualityStep(item, settings.quality);

  const video: ReencodeVideo =
    settings.mode === 'audioOnly' || settings.videoCodec === null
      ? { kind: 'copy' }
      : {
          kind: 'encode',
          codec: settings.videoCodec,
          maxWidth: clamp?.maxWidth ?? item.width,
          maxHeight: clamp?.maxHeight ?? item.height,
          maxBitrateKbps: reencodeBitrateFor(item, settings.quality, settings.videoCodec).capKbps,
        };

  const compresses = settings.audio === 'compress' || settings.mode === 'audioOnly';

  const audioTracks = item.audioStreams.map((stream): ReencodeAudioTrack => {
    if (!compresses || !isLosslessAudio(stream)) {
      return { kind: 'copy', index: stream.index };
    }

    const compressed = compressedAudioFor(stream, clamp?.maxAudioBitrateKbps ?? null);

    return { kind: 'encode', index: stream.index, ...compressed };
  });

  return {
    video,
    audioTracks,
    subtitleIndexes: item.subtitleStreams.map((stream) => stream.index),
  };
};

export type { ReencodeAudioTrack, ReencodePlan, ReencodeVideo };

export { planReencode };
