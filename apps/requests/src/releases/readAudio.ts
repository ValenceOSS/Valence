import type { AudioCodec } from '@ValenceContracts/schemas/ParsedRelease';

const CODECS: readonly [RegExp, AudioCodec][] = [
  [/\batmos\b|\bddpa\b/i, 'atmos'],
  [/\btrue ?hd\b/i, 'truehd'],
  [/\bdts[ -]?x\b/i, 'dtsx'],
  [/\bdts[ -]?hd[ -]?(ma|master)\b/i, 'dtsHdMa'],
  [/\bdts\b(?![ -]?(hd|x)\b)/i, 'dts'],
  [/\beac-?3\b|\bddp(a|\d|\b)|\bdd\+|\bdolby digital plus\b/i, 'eac3'],
  [/\bac-?3\b|\bdd ?\d|\bdd\b(?!\+)/i, 'ac3'],
  [/\bflac\b/i, 'flac'],
  [/\baac(\d|\b)/i, 'aac'],
  [/\bopus\b/i, 'opus'],
  [/\bmp3\b/i, 'mp3'],
  [/\bl?pcm\b/i, 'pcm'],
];

/**
 * The audio codecs a release name says it carries, and its channel layout where it gives one —
 * `5.1`, `7.1`, `2.0` — however it is joined to the codec before it.
 *
 * @param name - The name as it was given, since `5.1` is only unambiguous before its dot is spaced.
 * @param spaced - The name, with its words spaced.
 * @returns The codecs, and the channels.
 */
const readAudio = (
  name: string,
  spaced: string,
): { audio: AudioCodec[]; audioChannels: string | null } => {
  const channels =
    /(?<![\d.])([12567])[.]([01])(?![\d.])/.exec(name) ??
    /(?:\b|[a-z])([12567]) ([01])\b/i.exec(spaced);

  return {
    audio: CODECS.filter(([pattern]) => pattern.test(spaced)).map(([, codec]) => codec),
    audioChannels:
      channels?.[1] === undefined || channels[2] === undefined
        ? null
        : `${channels[1]}.${channels[2]}`,
  };
};

export { readAudio };
