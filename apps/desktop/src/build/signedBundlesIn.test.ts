import { describe, expect, it } from 'vitest';
import { signedBundlesIn } from './signedBundlesIn';

describe('signedBundlesIn', () => {
  it('pairs each bundle with the signature beside it and leaves everything else out', () => {
    expect(
      signedBundlesIn([
        'Valence-1.4.0-arm64.dmg',
        'Valence-1.4.0-arm64.app.tar.gz',
        'Valence-1.4.0-arm64.app.tar.gz.sig',
        'Valence-Setup-1.4.0-x64.exe',
        'Valence-Setup-1.4.0-x64.exe.sig',
      ]),
    ).toEqual({
      signed: [
        {
          platform: 'darwin-aarch64',
          file: 'Valence-1.4.0-arm64.app.tar.gz',
          signatureFile: 'Valence-1.4.0-arm64.app.tar.gz.sig',
        },
        {
          platform: 'windows-x86_64',
          file: 'Valence-Setup-1.4.0-x64.exe',
          signatureFile: 'Valence-Setup-1.4.0-x64.exe.sig',
        },
      ],
      unsigned: [],
    });
  });

  it('names a bundle that was not signed', () => {
    expect(signedBundlesIn(['Valence-1.4.0-x86_64.AppImage', 'Valence-1.4.0-amd64.deb'])).toEqual({
      signed: [],
      unsigned: ['Valence-1.4.0-x86_64.AppImage', 'Valence-1.4.0-amd64.deb'],
    });
  });
});
