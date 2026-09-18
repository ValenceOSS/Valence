import { bytesPerHour } from '@ValenceCore/functions/bytesPerHour';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { isAlreadyAsSmall } from '@ValenceCore/functions/isAlreadyAsSmall';
import {
  AUDIO_QUALITY_DETAILS,
  AUDIO_QUALITY_KBPS,
  AUDIO_QUALITY_LABELS,
} from '@ValenceContracts/schemas/Music';
import type { AudioQuality, MusicTrack } from '@ValenceContracts/schemas/Music';

type QualityChoice = {
  label: string;
  detail: string;
};

type PlayingFile = Pick<MusicTrack, 'codec' | 'isLossless' | 'bitrateKbps'>;

/**
 * Says roughly what an hour at a bitrate uses.
 *
 * @param kbps - The bitrate.
 * @returns The phrase.
 */
const anHourOf = (kbps: number): string => `about ${formatBytes(bytesPerHour(kbps))} an hour`;

/**
 * What a streaming quality is called and what it would send, for the song playing, and roughly what
 * an hour of it uses on a metered connection.
 *
 * The top quality sends the file as it is, which is only lossless where the file is: an MP3 is
 * called the original rather than lossless, and says what it is. An encoded quality no smaller than
 * the file plays the file as it is instead — the server will not encode a song into something
 * worse and no smaller — so it says so, rather than promising a bitrate it will not send.
 *
 * @param quality - The quality.
 * @param file - The song playing, where there is one.
 * @returns Its name and the line beneath it.
 */
const describeAudioQuality = (quality: AudioQuality, file: PlayingFile | null): QualityChoice => {
  if (quality === 'lossless') {
    if (file === null) {
      return { label: AUDIO_QUALITY_LABELS.lossless, detail: AUDIO_QUALITY_DETAILS.lossless };
    }

    const what =
      file.bitrateKbps === null
        ? file.codec.toUpperCase()
        : `${file.codec.toUpperCase()} · ${file.bitrateKbps.toString()} kbps`;

    return {
      label: file.isLossless ? AUDIO_QUALITY_LABELS.lossless : 'Original',
      detail: file.bitrateKbps === null ? what : `${what} · ${anHourOf(file.bitrateKbps)}`,
    };
  }

  const kbps = AUDIO_QUALITY_KBPS[quality];

  if (file !== null && isAlreadyAsSmall(file, kbps) && file.bitrateKbps !== null) {
    return {
      label: AUDIO_QUALITY_LABELS[quality],
      detail: `Plays the original, which is no bigger · ${anHourOf(file.bitrateKbps)}`,
    };
  }

  return {
    label: AUDIO_QUALITY_LABELS[quality],
    detail: `${AUDIO_QUALITY_DETAILS[quality]} · ${anHourOf(kbps)}`,
  };
};

export type { QualityChoice };

export { describeAudioQuality };
