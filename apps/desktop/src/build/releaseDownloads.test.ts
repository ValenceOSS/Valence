import { describe, expect, it } from 'vitest';
import { DEV_CHANNEL_TAG } from './DEV_CHANNEL_TAG';
import { releaseDownloads } from './releaseDownloads';

describe('releaseDownloads', () => {
  it("names a release's downloads by its tag", () => {
    expect(releaseDownloads('ValenceOSS/Valence', 'v1.4.0')).toBe(
      'https://github.com/ValenceOSS/Valence/releases/download/v1.4.0',
    );
  });

  it("names the dev channel's", () => {
    expect(releaseDownloads('ValenceOSS/Valence', DEV_CHANNEL_TAG)).toBe(
      'https://github.com/ValenceOSS/Valence/releases/download/desktop-dev',
    );
  });
});
