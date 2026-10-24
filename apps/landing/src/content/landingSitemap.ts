import { CHANGELOG } from './changelog/CHANGELOG';
import { LANDING_ORIGIN } from './LANDING_ORIGIN';
import { LANDING_PATHS } from './LANDING_PATHS';

/**
 * Writes the sitemap search engines read: every page of the site and every release on the
 * changelog, by its address on the published site.
 *
 * @returns The sitemap, as XML.
 */
const landingSitemap = (): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...LANDING_PATHS, ...CHANGELOG.map((entry) => `/changelog/${entry.slug}`)].map(
      (path) => `  <url><loc>${LANDING_ORIGIN}${path}</loc></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');

export { landingSitemap };
