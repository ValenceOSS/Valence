const LEADING_ARTICLE = /^(?:the|a|an)\s+(?=\S)/iu;

/**
 * The text a title is put in order by: the sort title somebody gave it, or else its title without a
 * leading "The", "A" or "An", in lower case, so "The Matrix" files under M.
 *
 * @param title - The title.
 * @param sortTitle - The sort title given to it, where one was.
 * @returns The text to compare.
 */
const sortKeyOf = (title: string, sortTitle?: string | null): string =>
  (sortTitle === null || sortTitle === undefined || sortTitle.trim() === ''
    ? title.replace(LEADING_ARTICLE, '')
    : sortTitle
  ).toLocaleLowerCase();

export { sortKeyOf };
