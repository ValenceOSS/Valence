/* oxlint-disable valence/no-hard-coded-strings -- the names releases go by, such as 1080p, BluRay or FLAC, which are the same in every language */
type ReleaseKind = 'video' | 'music' | 'book';

const RESOLUTIONS: readonly [RegExp, string][] = [
  [/\b(2160p|4k|uhd)\b/i, '2160p'],
  [/\b1080[pi]\b/i, '1080p'],
  [/\b720p\b/i, '720p'],
  [/\b(480p|576p|sd)\b/i, 'SD'],
];

const SOURCES: readonly [RegExp, string][] = [
  [/\bremux\b/i, 'Remux'],
  [/\b(blu-?ray|bdrip|brrip)\b/i, 'Blu-ray'],
  [/\bweb-?dl\b/i, 'WEB-DL'],
  [/\bweb-?rip\b/i, 'WEBRip'],
  [/\bweb\b/i, 'WEB'],
  [/\bhdtv\b/i, 'HDTV'],
  [/\bdvd(rip)?\b/i, 'DVD'],
];

const SOUNDS: readonly [RegExp, string][] = [
  [/\b24\s?-?bit\b|\bflac\s?24\b|\bhi-?res\b/i, 'FLAC 24-bit'],
  [/\bflac\b/i, 'FLAC'],
  [/\balac\b/i, 'ALAC'],
  [/\b320\b/i, 'MP3 320'],
  [/\bv0\b/i, 'MP3 V0'],
  [/\bopus\b/i, 'Opus'],
  [/\b(aac|m4a)\b/i, 'AAC'],
  [/\bmp3\b/i, 'MP3'],
];

const BOOKS: readonly [RegExp, string][] = [
  [/\bm4b\b/i, 'M4B'],
  [/\bepub\b/i, 'EPUB'],
  [/\bazw3?\b/i, 'AZW3'],
  [/\bmobi\b/i, 'MOBI'],
  [/\bpdf\b/i, 'PDF'],
  [/\bmp3\b/i, 'MP3'],
];

/**
 * The first name in a list a release's own name matches.
 *
 * @param title - The release's name.
 * @param names - Patterns, best known first, with what each is called.
 * @returns What it is called, or null.
 */
const firstOf = (title: string, names: readonly [RegExp, string][]): string | null =>
  names.find(([pattern]) => pattern.test(title))?.[1] ?? null;

/**
 * What a release's name says it is, as a person picking one by hand compares them: a film's or an
 * episode's resolution and source, music's format, a book's file format.
 *
 * @param title - The release's name.
 * @param kind - What kind of thing it is for.
 * @returns The words, or null where its name says nothing of it.
 */
const qualityOfReleaseTitle = (title: string, kind: ReleaseKind): string | null => {
  if (kind === 'music') {
    return firstOf(title, SOUNDS);
  }

  if (kind === 'book') {
    return firstOf(title, BOOKS);
  }

  const said = [firstOf(title, RESOLUTIONS), firstOf(title, SOURCES)].filter(
    (part) => part !== null,
  );

  return said.length === 0 ? null : said.join(' ');
};

export type { ReleaseKind };

export { qualityOfReleaseTitle };
