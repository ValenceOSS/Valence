import type { MusicQuality } from '@ValenceContracts/schemas/ParsedRelease';

const QUALITIES: readonly [RegExp, MusicQuality][] = [
  [/\balac\b/i, 'alac'],
  [
    /\bflac\b.*\b24 ?(bit|b)\b|\b24 ?(bit|b)\b.*\bflac\b|\b24[ -](44|48|88|96|176|192)\b|\bhi-?res\b/i,
    'flac24',
  ],
  [/\bflac\b/i, 'flac'],
  [/\b320 ?(kbps|k)?\b/i, 'mp3-320'],
  [/\bv0\b/i, 'mp3-v0'],
  [/\b256 ?(kbps|k)\b|\bm4a\b|\baac\b/i, 'aac'],
  [/\bopus\b/i, 'opus'],
  [/\bv2\b/i, 'mp3-v2'],
  [/\bmp3\b/i, 'mp3'],
];

/**
 * How an album was encoded, by what its release name says: 24-bit FLAC, FLAC, ALAC, MP3 at 320 or
 * V0 or V2, AAC, or Opus — the first that fits, best first.
 *
 * @param spaced - The name, with its words spaced.
 * @returns The quality, or null where it names no audio format.
 */
const readMusicQuality = (spaced: string): MusicQuality | null =>
  QUALITIES.find(([pattern]) => pattern.test(spaced))?.[1] ?? null;

export { readMusicQuality };
