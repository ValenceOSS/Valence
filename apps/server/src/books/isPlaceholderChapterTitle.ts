import { plainly } from '@ValenceServer/text/plainly';

const ONLY_NUMBERED = /^(?:ch(?:apter)?|c|ep(?:isode)?|#)?[\s._-]*\d{1,4}(?:[.,]\d{1,2})?$/i;

/**
 * Whether a chapter's title says nothing of its own: empty, only its number, or just the name of
 * the book it is in, which is what a file called after its series and a number leaves behind.
 *
 * @param title - The chapter's title.
 * @param bookNames - What the book it is in is called, and the series it belongs to.
 * @returns Whether a better name would be worth finding.
 */
const isPlaceholderChapterTitle = (title: string, bookNames: readonly string[]): boolean => {
  const said = title.trim();

  return (
    said === '' ||
    ONLY_NUMBERED.test(said) ||
    bookNames.some((name) => plainly(name) !== '' && plainly(name) === plainly(said))
  );
};

export { isPlaceholderChapterTitle };
