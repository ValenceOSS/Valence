import { bytesPerHour } from '@ValenceCore/functions/bytesPerHour';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { isAlreadyAsSmall } from '@ValenceCore/functions/isAlreadyAsSmall';
import {
  AUDIO_QUALITY_DETAILS,
  AUDIO_QUALITY_KBPS,
  AUDIO_QUALITY_LABELS,
} from '@ValenceContracts/schemas/Music';
import type { AudioQuality, MusicTrack } from '@ValenceContracts/schemas/Music';
import { say } from '@ValenceI18n/say';

type QualityChoice = {
  label: string;
  detail: string;
};

type PlayingFile = Pick<MusicTrack, 'codec' | 'isLossless' | 'bitrateKbps'>;

/**
 * Says what a quality sends, then roughly what an hour of it uses.
 *
 * @param what - What it sends, such as a codec and a bitrate.
 * @param kbps - The bitrate.
 * @returns The line.
 */
const withAnHourOf = (what: string, kbps: number): string =>
  say('client.music.describeAudioQuality.whatAboutSizeAnHour', {
    what,
    size: formatBytes(bytesPerHour(kbps)),
  });

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
        : say('client.music.describeAudioQuality.codecKbps', {
            codec: file.codec.toUpperCase(),
            kbps: file.bitrateKbps.toString(),
          });

    return {
      label: file.isLossless ? AUDIO_QUALITY_LABELS.lossless : say('common.original'),
      detail: file.bitrateKbps === null ? what : withAnHourOf(what, file.bitrateKbps),
    };
  }

  const kbps = AUDIO_QUALITY_KBPS[quality];

  if (file !== null && isAlreadyAsSmall(file, kbps) && file.bitrateKbps !== null) {
    return {
      label: AUDIO_QUALITY_LABELS[quality],
      detail: say('client.music.describeAudioQuality.playsTheOriginalAboutSizeAnHour', {
        size: formatBytes(bytesPerHour(file.bitrateKbps)),
      }),
    };
  }

  return {
    label: AUDIO_QUALITY_LABELS[quality],
    detail: withAnHourOf(AUDIO_QUALITY_DETAILS[quality], kbps),
  };
};

export type { QualityChoice };

export { describeAudioQuality };
