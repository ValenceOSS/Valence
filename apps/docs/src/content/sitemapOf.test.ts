import { describe, expect, it } from 'vitest';
import { sitemapOf } from './sitemapOf';

describe('sitemapOf', () => {
  it('lists the home page and every page by its published address', () => {
    const sitemap = sitemapOf([{ path: '/start/quick-start' }, { path: '/use/plugins' }]);

    expect(sitemap).toContain('<loc>https://docs.getvalence.app/</loc>');
    expect(sitemap).toContain('<loc>https://docs.getvalence.app/api</loc>');
    expect(sitemap).toContain('<loc>https://docs.getvalence.app/start/quick-start</loc>');
    expect(sitemap).toContain('<loc>https://docs.getvalence.app/use/plugins</loc>');
    expect(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });
});
