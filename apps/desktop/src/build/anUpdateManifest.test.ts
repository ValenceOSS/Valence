import { describe, expect, it } from 'vitest';
import { anUpdateManifest } from './anUpdateManifest';

const RELEASE = {
  version: '1.4.0',
  notes: 'https://github.com/ValenceOSS/Valence/releases/tag/v1.4.0',
  publishedAt: new Date('2026-11-16T12:00:00Z'),
  downloads: 'https://github.com/ValenceOSS/Valence/releases/download/v1.4.0',
};

describe('anUpdateManifest', () => {
  it('lists each platform with its download and signature', () => {
    expect(
      anUpdateManifest(RELEASE, [
        {
          platform: 'darwin-aarch64',
          file: 'Valence-1.4.0-arm64.app.tar.gz',
          signature: 'c2lnbmVk\n',
        },
        { platform: 'windows-x86_64', file: 'Valence-Setup-1.4.0-x64.exe', signature: 'b3RoZXI=' },
      ]),
    ).toEqual({
      version: '1.4.0',
      notes: 'https://github.com/ValenceOSS/Valence/releases/tag/v1.4.0',
      pub_date: '2026-11-16T12:00:00.000Z',
      platforms: {
        'darwin-aarch64': {
          signature: 'c2lnbmVk',
          url: 'https://github.com/ValenceOSS/Valence/releases/download/v1.4.0/Valence-1.4.0-arm64.app.tar.gz',
        },
        'windows-x86_64': {
          signature: 'b3RoZXI=',
          url: 'https://github.com/ValenceOSS/Valence/releases/download/v1.4.0/Valence-Setup-1.4.0-x64.exe',
        },
      },
    });
  });

  it('writes a file name safely into its address, whatever the downloads address ends with', () => {
    const manifest = anUpdateManifest({ ...RELEASE, downloads: `${RELEASE.downloads}/` }, [
      {
        platform: 'linux-x86_64-appimage',
        file: 'Valence-1.4.0+1-x86_64.AppImage',
        signature: 'cw==',
      },
    ]);

    expect(manifest.platforms['linux-x86_64-appimage']?.url).toBe(
      'https://github.com/ValenceOSS/Valence/releases/download/v1.4.0/Valence-1.4.0%2B1-x86_64.AppImage',
    );
  });

  it('lists nothing when nothing was built', () => {
    expect(anUpdateManifest(RELEASE, []).platforms).toEqual({});
  });
});
