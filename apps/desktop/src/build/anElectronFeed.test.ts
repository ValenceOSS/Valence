import { describe, expect, it } from 'vitest';
import { anElectronFeed } from './anElectronFeed';

const RELEASED_AT = new Date('2026-11-16T12:00:00Z');

describe('anElectronFeed', () => {
  it('lists each file with its checksum and size, as electron-builder wrote them', () => {
    expect(
      anElectronFeed(
        '1.5.0',
        [
          { url: 'Valence-Setup-1.5.0-arm64.exe', sha512: 'YXJt', size: 2 },
          { url: 'Valence-Setup-1.5.0-x64.exe', sha512: 'eDY0', size: 1 },
        ],
        RELEASED_AT,
      ),
    ).toBe(
      [
        'version: "1.5.0"',
        'files:',
        '  - url: "Valence-Setup-1.5.0-x64.exe"',
        '    sha512: "eDY0"',
        '    size: 1',
        '  - url: "Valence-Setup-1.5.0-arm64.exe"',
        '    sha512: "YXJt"',
        '    size: 2',
        'path: "Valence-Setup-1.5.0-x64.exe"',
        'sha512: "eDY0"',
        'releaseDate: "2026-11-16T12:00:00.000Z"',
        '',
      ].join('\n'),
    );
  });

  it('keeps a version that names the dev channel as text', () => {
    const feed = anElectronFeed(
      '1.5.0-dev.12',
      [{ url: 'Valence-1.5.0-dev.12-arm64.AppImage', sha512: 'c2hh', size: 3 }],
      RELEASED_AT,
    );

    expect(feed).toContain('version: "1.5.0-dev.12"\n');
    expect(feed).toContain('path: "Valence-1.5.0-dev.12-arm64.AppImage"\n');
  });

  it('writes a name that YAML would read as something else safely', () => {
    expect(
      anElectronFeed('1.5.0', [{ url: 'a: "b"', sha512: 'x', size: 0 }], RELEASED_AT),
    ).toContain('  - url: "a: \\"b\\""\n');
  });
});
