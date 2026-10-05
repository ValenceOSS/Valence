import { OS_NAME } from 'camoufox-js/dist/pkgman.js';
import { describe, expect, it } from 'vitest';
import { PinnedCamoufoxFetcher } from './PinnedCamoufoxFetcher';

describe('PinnedCamoufoxFetcher', () => {
  it('aims the installer at the pinned release for this machine, not the newest one', async () => {
    const fetcher = new PinnedCamoufoxFetcher('152.0.4', 'beta.30');

    await fetcher.fetchLatest();

    expect(fetcher.verstr).toBe('152.0.4-beta.30');
    expect(fetcher.url).toBe(
      `https://github.com/daijro/camoufox/releases/download/v152.0.4-beta.30/camoufox-152.0.4-beta.30-${OS_NAME}.${fetcher.arch}.zip`,
    );
  });

  it('refuses a release camoufox-js would not run', async () => {
    const fetcher = new PinnedCamoufoxFetcher('152.0.4', 'alpha.0');

    await expect(fetcher.fetchLatest()).rejects.toThrow(
      /does not support Camoufox 152\.0\.4-alpha\.0/u,
    );
  });
});
