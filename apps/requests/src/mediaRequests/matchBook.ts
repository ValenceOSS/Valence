import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

const SHORT_TITLE_WORDS = 2;

const VOLUME_NUMBER = /^\d{1,3}$/;

/**
 * A name as plain words: lower case, with anything that is not a letter or a digit a space between
 * them, so a release's dots, dashes and brackets don't stand in the way.
 *
 * @param name - The name.
 * @returns Its words, each with a space either side, to be searched for whole.
 */
const wordsOf = (name: string): string =>
  ` ${name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()} `;

/**
 * Whether the title, where a release's name has it, is followed by the number of the volume asked
 * for, or by no number at all: `The Legend of Randidly Ghosthound 12` is the twelfth book of a
 * series whose first is called the same, not that first book.
 *
 * @param named - The release's name, as words.
 * @param wanted - The title, as words.
 * @param volume - The volume asked for.
 * @returns Whether one place it is named is that volume's.
 */
const isNamedAsVolume = (named: string, wanted: string, volume: number): boolean => {
  for (let at = named.indexOf(wanted); at !== -1; at = named.indexOf(wanted, at + 1)) {
    const next = named.slice(at + wanted.length).split(' ')[0] ?? '';

    if (!VOLUME_NUMBER.test(next) || Number(next) === volume) {
      return true;
    }
  }

  return false;
};

/**
 * Whether a release's name is for a book: its title, or another it goes by, appears in it word for
 * word — wherever its author, its year and its format put it — not followed by the number of another
 * volume of its series, and, for a title of a word or two that could be part of anything, its
 * author's surname does too. The volume asked for is the one its series says, and the first where
 * nothing says.
 *
 * @param request - The book asked for.
 * @param releaseTitle - The release's name.
 * @param options - Whether a number after the title must be the volume asked for, which it need
 *   not be where the title is a series' and the number starts the range a pack holds.
 * @returns Whether it is for that book.
 */
const matchBook = (
  request: Pick<MediaRequestRecord, 'title' | 'aliases' | 'artistName'> &
    Partial<Pick<MediaRequestRecord, 'narrations'>>,
  releaseTitle: string,
  { checksVolume = true }: { checksVolume?: boolean } = {},
): boolean => {
  const named = wordsOf(releaseTitle);
  const surname = (request.artistName ?? '').trim().split(/\s+/).at(-1) ?? '';
  const position = Number(
    (request.narrations ?? []).find((narration) => (narration.seriesPosition ?? null) !== null)
      ?.seriesPosition ?? 1,
  );
  const volume = Number.isFinite(position) ? position : 1;

  return [request.title, ...request.aliases].some((title) => {
    const wanted = wordsOf(title);

    if (wanted.trim() === '' || !named.includes(wanted)) {
      return false;
    }

    if (checksVolume && !isNamedAsVolume(named, wanted, volume)) {
      return false;
    }

    return (
      wanted.trim().split(' ').length > SHORT_TITLE_WORDS ||
      (surname !== '' && named.includes(wordsOf(surname)))
    );
  });
};

export { matchBook };
