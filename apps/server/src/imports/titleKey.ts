import { nameKey } from '@ValenceServer/music/nameKey';

/**
 * Reduces a title to what two spellings of it have in common, leaving out punctuation and a
 * leading article, so titles from two servers can be compared.
 *
 * @param title - The title.
 * @returns The key it is matched on.
 */
const titleKey = (title: string): string =>
  nameKey(title)
    .replace(/&/g, 'and')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/^(the|a|an) /, '');

export { titleKey };
