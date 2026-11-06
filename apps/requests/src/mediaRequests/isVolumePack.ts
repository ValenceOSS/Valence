import { volumeOf } from '@ValenceRequests/mediaRequests/volumeOf';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

const RANGES =
  /\bv(?:ol(?:ume)?s?)?\.?\s*0*(\d{1,3})\s*(?:[-–~]|to|thru)\s*(?:v(?:ol(?:ume)?)?\.?\s*)?0*(\d{1,3})(?!\d)/giu;

const SINGLES = /\bv(?:ol(?:ume)?)?\.?\s*0*(\d{1,3})(?!\d)(?!\s*(?:[-–~]|to|thru)\s*\d)/giu;

const WHOLE = /\b(?:complete|collection|omnibus|box(?:ed)?\s*set)\b/iu;

const NOT_A_BOOK =
  /\b(?:soundtrack|ost|mp3|flac|anime|episodes?|blu-?ray|bd-?rip|web-?dl|(?:480|720|1080|2160)p)\b/iu;

/**
 * The words of a name, lower case and with anything that is not a letter or a digit a single
 * space, each with a space either side, to be searched for whole.
 *
 * @param name - The name.
 * @returns Its words.
 */
const wordsOf = (name: string): string =>
  ` ${name
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()} `;

/**
 * Whether a release holds the volume of a series a book was asked for as: it names the series, and
 * holds that volume — a run of volumes taking it in, as manga is shared, `v01-20`, or that volume
 * on its own, or the whole series as a complete collection. A release of chapters, which names no
 * volume, is not one, nor is anything that reads as music or video of the same name.
 *
 * @param request - The book.
 * @param releaseTitle - The release's name.
 * @returns Whether it holds that volume.
 */
const isVolumePack = (
  request: Pick<MediaRequestRecord, 'title'>,
  releaseTitle: string,
): boolean => {
  const wanted = volumeOf(request.title);

  if (wanted === null || NOT_A_BOOK.test(releaseTitle)) {
    return false;
  }

  if (!wordsOf(releaseTitle).includes(wordsOf(wanted.series))) {
    return false;
  }

  const ranges = [...releaseTitle.matchAll(RANGES)].map((found) => [
    Number(found[1]),
    Number(found[2]),
  ]);
  const singles = [...releaseTitle.matchAll(SINGLES)].map((found) => Number(found[1]));

  return (
    ranges.some(([from = 0, to = 0]) => from <= wanted.volume && wanted.volume <= to) ||
    singles.includes(wanted.volume) ||
    (ranges.length === 0 && singles.length === 0 && WHOLE.test(releaseTitle))
  );
};

export { isVolumePack };
