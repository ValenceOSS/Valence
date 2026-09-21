const FRONTMATTER = /^---\n[\s\S]*?\n---\n/u;

/**
 * Reduces a page's MDX to the words a reader would search for.
 *
 * @param source - The page as written.
 * @returns Its text with the frontmatter, markup characters and link targets removed.
 */
const toSearchText = (source: string): string =>
  source
    .replace(FRONTMATTER, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/<\/?[A-Za-z][^>]*>/gu, ' ')
    .replace(/[`*_#>|]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();

export { toSearchText };
