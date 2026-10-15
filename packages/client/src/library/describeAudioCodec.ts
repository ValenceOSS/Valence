import { say } from '@ValenceI18n/say';

const DOLBY: Readonly<Record<string, () => string>> = {
  atmos: () => say('client.library.qualityBadges.dolbyAtmos'),
  truehd: () => say('client.library.qualityBadges.dolbyTrueHD'),
  eac3: () => say('client.library.qualityBadges.dolbyDigital2'),
  ac3: () => say('client.library.qualityBadges.dolbyDigital'),
};

const FORMATS: Readonly<Record<string, string>> = {
  // oxlint-disable-next-line valence/no-hard-coded-strings -- a sound format's own name
  opus: 'Opus',
  // oxlint-disable-next-line valence/no-hard-coded-strings -- a sound format's own name
  vorbis: 'Vorbis',
};

/**
 * Names a sound format the way it is sold: Dolby's by their brand names, Atmos among them, and the
 * rest by their own names, upper-cased where that is how they are written.
 *
 * @param codec - The codec as Valence stores it, or `atmos` for a track carrying Atmos.
 * @returns What to call it.
 */
const describeAudioCodec = (codec: string): string =>
  DOLBY[codec]?.() ?? FORMATS[codec] ?? codec.toUpperCase();

export { describeAudioCodec };
