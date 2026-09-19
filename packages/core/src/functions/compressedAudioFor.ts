import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

const CODEC = 'eac3';

const MAX_CHANNELS = 6;

const KBPS_BY_CHANNELS = [
  { atOrBelow: 2, kbps: 192 },
  { atOrBelow: 6, kbps: 640 },
] as const;

type CompressedAudio = {
  codec: string;
  channels: number;
  maxBitrateKbps: number;
};

/**
 * What a lossless track becomes when somebody asks for the audio to be compressed.
 *
 * E-AC-3 rather than anything newer, because this file is being kept and played by whatever is in
 * the house: every television and streaming box made this century decodes it, where Opus in a
 * Matroska file is a coin toss. It tops out at six channels, so a 7.1 Atmos track comes back as
 * 5.1 — a real loss, and the one that compressing the audio is asking for. Worth saying plainly at
 * the point of choosing rather than discovering afterwards.
 *
 * @param stream - The track being replaced.
 * @param ceilingKbps - The rung's audio ceiling, where it states one.
 * @returns What to encode it to.
 */
const compressedAudioFor = (
  stream: AudioStream,
  ceilingKbps: number | null = null,
): CompressedAudio => {
  const channels = Math.min(stream.channels, MAX_CHANNELS);
  const byWidth = KBPS_BY_CHANNELS.find((step) => channels <= step.atOrBelow)?.kbps ?? 640;

  return {
    codec: CODEC,
    channels,
    maxBitrateKbps: ceilingKbps === null ? byWidth : Math.min(byWidth, ceilingKbps),
  };
};

export type { CompressedAudio };

export { compressedAudioFor };
