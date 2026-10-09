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

export { reduceTitle };
