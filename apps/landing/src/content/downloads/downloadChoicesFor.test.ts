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
    windowsArm: null,
    linux: null,
    linuxArm: null,
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

  it('offers the ARM64 builds beside the x64 ones where the release carries them', () => {
    const { lead, others } = downloadChoicesFor(
      {
        ...RELEASE,
        installers: {
          ...RELEASE.installers,
          windowsArm: {
            name: 'Valence-Setup-1.4.0-arm64.exe',
            url: 'https://example.test/setup-arm64.exe',
            sizeBytes: 210,
          },
          linuxArm: {
            name: 'Valence-1.4.0-arm64.AppImage',
            url: 'https://example.test/arm64.AppImage',
            sizeBytes: 220,
          },
        },
      },
      'windows',
    );

    expect(lead?.id).toBe('windows');
    expect(others.map((choice) => choice.id)).toEqual([
      'macAppleSilicon',
      'macIntel',
      'windowsArm',
      'linux',
      'linuxArm',
    ]);
    expect(others.find((choice) => choice.id === 'windowsArm')?.detail).toBe('Installer · arm64');
  });

  it('leaves out an ARM64 build the release does not carry, rather than promising it', () => {
    const { others } = downloadChoicesFor(RELEASE, 'windows');

    expect(others.some((choice) => choice.id === 'windowsArm')).toBe(false);
    expect(others.some((choice) => choice.id === 'linuxArm')).toBe(false);
  });

  it('leads with nothing on a phone, or where no release could be read', () => {
    expect(downloadChoicesFor(RELEASE, 'iphone').lead).toBeNull();
    expect(downloadChoicesFor(null, 'unknown').others).toHaveLength(4);
  });
});
