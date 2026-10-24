const DOCS_ORIGIN = 'https://docs.getvalence.app';

/**
 * Writes the sitemap search engines read: the home page, the API reference and every page of the
 * documentation, by its address on the published site.
 *
 * @param pages - Every page, in the order the sidebar lists them.
 * @returns The sitemap, as XML.
 */
const sitemapOf = (pages: readonly { path: string }[]): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...['/', '/api', ...pages.map((page) => page.path)].map(
      (path) => `  <url><loc>${DOCS_ORIGIN}${path}</loc></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');

export { sitemapOf };
