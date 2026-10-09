import type { VideoCodec } from '@ValenceContracts/schemas/ParsedRelease';

const CODECS: readonly [RegExp, VideoCodec][] = [
  [/\bh ?266\b|\bvvc\b|\bvvenc\b/i, 'h266'],
  [/\bav1\b/i, 'av1'],
  [/\bx ?265\b|\bh ?265\b|\bhevc\b/i, 'h265'],
  [/\bx ?264\b|\bh ?264\b|\bavc\b|\bhi10p\b/i, 'h264'],
  [/\bxvid\b|\bdivx\b/i, 'xvid'],
  [/\bmpeg-?2\b/i, 'mpeg2'],
];

/**
 * The video codec a release name says it uses, whatever it calls it — x265, H.265 and HEVC are one.
 *
 * @param spaced - The name, with its words spaced.
 * @returns The codec, or null where it does not say.
 */
const readCodec = (spaced: string): VideoCodec | null =>
  CODECS.find(([pattern]) => pattern.test(spaced))?.[1] ?? null;

export { readCodec };
