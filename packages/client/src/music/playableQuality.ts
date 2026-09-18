import type { AudioQuality, MusicTrack } from '@ValenceContracts/schemas/Music';

const TYPES: Readonly<Record<string, string>> = {
  flac: 'audio/flac',
  mp3: 'audio/mpeg',
  'mpeg 1 layer 3': 'audio/mpeg',
  'mpeg 2 layer 3': 'audio/mpeg',
  aac: 'audio/mp4; codecs="mp4a.40.2"',
  'mpeg-4/aac': 'audio/mp4; codecs="mp4a.40.2"',
  alac: 'audio/mp4; codecs="alac"',
  opus: 'audio/ogg; codecs="opus"',
  vorbis: 'audio/ogg; codecs="vorbis"',
  pcm: 'audio/wav',
};

/**
 * What a track's file would be announced as to a browser, from the codec it was read as.
 *
 * @param codec - The codec, as the scan named it.
 * @returns The type to ask about, or nothing where no browser plays it.
 */
const typeOfCodec = (codec: string): string | null => {
  const named = codec.toLowerCase();

  return TYPES[named] ?? (named.startsWith('pcm') ? 'audio/wav' : null);
};

/**
 * The quality to ask the server for, given what was chosen and what this device can play.
 *
 * Lossless means the file as it is, and not every file plays everywhere — ALAC in Chrome, WMA
 * anywhere. Where the file will not play, the highest encode is asked for instead, which every
 * browser plays, rather than silence.
 *
 * @param track - The track.
 * @param chosen - The quality somebody chose.
 * @param canPlay - Whether this device plays a type.
 * @returns The quality to ask for.
 */
const playableQuality = (
  track: Pick<MusicTrack, 'codec'>,
  chosen: AudioQuality,
  canPlay: (type: string) => boolean,
): AudioQuality => {
  if (chosen !== 'lossless') {
    return chosen;
  }

  const type = typeOfCodec(track.codec);

  return type !== null && canPlay(type) ? 'lossless' : 'high';
};

export { playableQuality, typeOfCodec };
