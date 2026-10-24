const FRONTMATTER = /^---\n[\s\S]*?\n---\n/u;

/**
 * Reduces a page's MDX to the words a reader would search for.
 *
 * @param source - The page as written.
 * @returns Its text with the frontmatter, markup and link targets removed, keeping an underscore
 * inside a name such as `VALENCE_DATA_DIR`.
 */
const toSearchText = (source: string): string =>
  source
    .replace(FRONTMATTER, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/<\/?[A-Za-z][^>]*>/gu, ' ')
    .replace(/[`*#>|]/gu, ' ')
    .replace(/(^|[^\p{L}\p{N}_])_+|_+(?=[^\p{L}\p{N}_]|$)/gu, '$1 ')
    .replace(/\s+/gu, ' ')
    .trim();

export { toSearchText };
