import { describe, expect, it } from 'vitest';
import { downloadChoicesFor } from './downloadChoicesFor';
import { RELEASES_URL } from './RELEASES_URL';
import type { LatestRelease } from './latestRelease';

const RELEASE: LatestRelease = {
  version: 'v1.1.2',
  publishedAt: '2026-09-25',
  url: 'https://github.com/ValenceOSS/Valence/releases/tag/v1.1.2',
  installers: {
    macAppleSilicon: {
      name: 'Valence-1.1.2-arm64.dmg',
      url: 'https://example.test/arm64.dmg',
      sizeBytes: 100,
    },
    macIntel: null,
    windows: {
      name: 'Valence-Setup-1.1.2.exe',
      url: 'https://example.test/setup.exe',
      sizeBytes: 200,
    },
    linux: null,
  },
};

describe('downloadChoicesFor', () => {
  it('leads with the download for the visitor’s own computer', () => {
    const { lead, others } = downloadChoicesFor(RELEASE, 'windows');

    expect(lead?.id).toBe('windows');
    expect(lead?.url).toBe('https://example.test/setup.exe');
    expect(others.map((choice) => choice.id)).toEqual(['macAppleSilicon', 'macIntel', 'linux']);
  });

  it('leads a Mac with Apple silicon', () => {
    expect(downloadChoicesFor(RELEASE, 'mac').lead?.fileName).toBe('Valence-1.1.2-arm64.dmg');
  });

  it('sends a download the release does not carry to the release page', () => {
    const { others } = downloadChoicesFor(RELEASE, 'windows');
    const linux = others.find((choice) => choice.id === 'linux');

    expect(linux?.url).toBe(RELEASES_URL);
    expect(linux?.fileName).toBeNull();
    expect(linux?.sizeBytes).toBeNull();
  });

  it('leads with nothing on a phone, or where no release could be read', () => {
    expect(downloadChoicesFor(RELEASE, 'iphone').lead).toBeNull();
    expect(downloadChoicesFor(null, 'unknown').others).toHaveLength(4);
  });
});
