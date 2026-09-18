import { bytesPerHour } from '@ValenceCore/functions/bytesPerHour';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { AUDIO_QUALITY_DETAILS, AUDIO_QUALITY_KBPS } from '@ValenceContracts/schemas/Music';
import type { AudioQuality } from '@ValenceContracts/schemas/Music';

/**
 * What a streaming quality is and roughly what an hour of it uses, for choosing between them on a
 * metered connection.
 *
 * The encoded qualities run at a fixed rate, so their hour is known. Lossless is the file itself,
 * so its hour depends on the song: it is worked out from the one playing where there is one, and
 * left unsaid where there is not rather than guessed.
 *
 * @param quality - The quality.
 * @param fileKbps - The bitrate of the file playing, where one is.
 * @returns The line to show beneath the quality's name.
 */
const describeAudioQuality = (quality: AudioQuality, fileKbps: number | null): string => {
  const kbps = quality === 'lossless' ? fileKbps : AUDIO_QUALITY_KBPS[quality];

  return kbps === null || kbps <= 0
    ? AUDIO_QUALITY_DETAILS[quality]
    : `${AUDIO_QUALITY_DETAILS[quality]} · about ${formatBytes(bytesPerHour(kbps))} an hour`;
};

export { describeAudioQuality };
