import { describe, expect, it } from 'vitest';
import { DOC_PAGES } from './DOC_PAGES';

describe('DOC_PAGES', () => {
  it('holds every page, the new ones included, each with a title', () => {
    const paths = DOC_PAGES.map((page) => page.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        '/install/complete-compose-file',
        '/start/set-up-with-an-ai',
        '/use/a-tour-of-valence',
        '/use/audiobooks',
        '/use/the-phone-app',
        '/develop/plugins',
        '/use/plugins',
        '/plugins/getting-started',
        '/plugins/manifest',
        '/plugins/permissions',
        '/plugins/host-api',
        '/plugins/building-blocks',
        '/plugins/themes',
        '/plugins/accounts-and-oauth',
        '/plugins/schedules-and-events',
        '/plugins/packaging',
        '/plugins/publishing',
        '/plugins/upgrades-and-rollback',
        '/plugins/example-anime-tracking',
        '/plugins/example-playlist-import',
      ]),
    );

    for (const page of DOC_PAGES) {
      expect(page.title.length).toBeGreaterThan(0);
    }
  });
});
