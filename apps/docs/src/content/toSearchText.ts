const FRONTMATTER = /^---\n[\s\S]*?\n---\n/u;

/**
 * Reduces a page's MDX to the words a reader would search for.
 *
 * @param source - The page as written.
 * @returns Its text with the frontmatter, markup characters and link targets removed. An underscore
 * inside a name, as in `VALENCE_DATA_DIR`, is kept, so the name can be searched for as written.
 */
const toSearchText = (source: string): string =>
  source
    .replace(FRONTMATTER, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/<\/?[A-Za-z][^>]*>/gu, ' ')
    .replace(/[`*#>|]/gu, ' ')
    .replace(/(?<![\p{L}\p{N}])_+|_+(?![\p{L}\p{N}])/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();

export { toSearchText };
