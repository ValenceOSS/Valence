import type { IAudioMetadata } from 'music-metadata';

const ADVISORY_TAGS = new Set([
  'txxx:itunesadvisory',
  'itunesadvisory',
  '----:com.apple.itunes:itunesadvisory',
  'rtng',
  'explicit',
  'txxx:explicit',
]);

const EXPLICIT_VALUES = new Set(['1', '4', 'explicit', 'true', 'yes']);

/**
 * Whether a track's own tags say it is explicit.
 *
 * There is no one standard for it, so it is read wherever the common taggers put it: the iTunes
 * advisory — an MP4 `rtng` atom, or the same value as an ID3 `TXXX` frame or a Vorbis comment,
 * where 1 (and an older 4) mean explicit and 2 means a clean edit — and the plainer `EXPLICIT`
 * comment some taggers write instead. A track that says nothing is not called explicit.
 *
 * @param meta - Everything read from the file.
 * @returns Whether it is explicit.
 */
const isExplicitIn = (meta: Pick<IAudioMetadata, 'native'>): boolean =>
  Object.values(meta.native).some((tags) =>
    tags.some(
      (tag) =>
        ADVISORY_TAGS.has(tag.id.toLowerCase()) &&
        (typeof tag.value === 'string' || typeof tag.value === 'number') &&
        EXPLICIT_VALUES.has(String(tag.value).trim().toLowerCase()),
    ),
  );

export { isExplicitIn };
