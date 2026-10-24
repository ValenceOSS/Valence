import { describe, expect, it } from 'vitest';
import { CHANGELOG } from './changelog/CHANGELOG';
import { landingSitemap } from './landingSitemap';

describe('landingSitemap', () => {
  it('lists every page and every release on the www host', () => {
    const sitemap = landingSitemap();

    expect(sitemap).toContain('<loc>https://www.getvalence.app/</loc>');
    expect(sitemap).toContain('<loc>https://www.getvalence.app/principles</loc>');
    expect(sitemap).toContain(
      `<loc>https://www.getvalence.app/changelog/${CHANGELOG[0]?.slug ?? ''}</loc>`,
    );
    expect(sitemap).not.toContain('/roadmap');
  });
});
