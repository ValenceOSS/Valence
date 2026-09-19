/**
 * A title reduced to what two spellings of it share: lower case, without accents or punctuation,
 * with "&" as "and", a leading "the" dropped, and a year in brackets at the end dropped.
 *
 * @param title - The title.
 * @returns It reduced.
 */
const reduceTitle = (title: string): string =>
  title
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s*\((?:19|20)\d{2}\)\s*$/, '')
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .replace(/^the /, '');

/**
 * Whether a release's title names what was asked for, spelled however the release spelled it.
 *
 * @param released - The title a release name gives.
 * @param wanted - The title asked for.
 * @returns Whether they are the same.
 */
const isSameTitle = (released: string, wanted: string): boolean => {
  const reduced = reduceTitle(released);

  return reduced !== '' && reduced === reduceTitle(wanted);
};

export { isSameTitle };
