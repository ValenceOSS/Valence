import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

const SHORT_TITLE_WORDS = 2;

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
 * Whether a release's name is for a book: its title, or another it goes by, appears in it word for
 * word — wherever its author, its year and its format put it — and, for a title of a word or two
 * that could be part of anything, its author's surname does too.
 *
 * @param request - The book asked for.
 * @param releaseTitle - The release's name.
 * @returns Whether it is for that book.
 */
const matchBook = (
  request: Pick<MediaRequestRecord, 'title' | 'aliases' | 'artistName'>,
  releaseTitle: string,
): boolean => {
  const named = wordsOf(releaseTitle);
  const surname = (request.artistName ?? '').trim().split(/\s+/).at(-1) ?? '';

  return [request.title, ...request.aliases].some((title) => {
    const wanted = wordsOf(title);

    if (wanted.trim() === '' || !named.includes(wanted)) {
      return false;
    }

    return (
      wanted.trim().split(' ').length > SHORT_TITLE_WORDS ||
      (surname !== '' && named.includes(wordsOf(surname)))
    );
  });
};

export { matchBook };
