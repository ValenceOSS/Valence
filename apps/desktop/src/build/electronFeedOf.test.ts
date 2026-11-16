import { describe, expect, it } from 'vitest';
import { electronFeedOf } from './electronFeedOf';

describe('electronFeedOf', () => {
  it.each([
    ['Valence-Setup-1.5.0-x64.exe', 'latest.yml'],
    ['Valence-Setup-1.5.0-arm64.exe', 'latest.yml'],
    ['Valence-1.5.0-arm64-mac.zip', 'latest-mac.yml'],
    ['Valence-1.5.0-x64-mac.zip', 'latest-mac.yml'],
    ['Valence-1.5.0-x86_64.AppImage', 'latest-linux.yml'],
    ['Valence-1.5.0-arm64.AppImage', 'latest-linux-arm64.yml'],
  ])('puts %s in %s', (file, feed) => {
    expect(electronFeedOf(file, 'latest')).toBe(feed);
  });

  it("names the dev channel's feeds as the Electron app's dev builds read them", () => {
    expect(electronFeedOf('Valence-Setup-1.5.0-dev.12-x64.exe', 'dev')).toBe('dev.yml');
    expect(electronFeedOf('Valence-1.5.0-dev.12-arm64-mac.zip', 'dev')).toBe('dev-mac.yml');
    expect(electronFeedOf('Valence-1.5.0-dev.12-arm64.AppImage', 'dev')).toBe(
      'dev-linux-arm64.yml',
    );
  });

  it.each([
    'Valence-1.5.0-arm64.dmg',
    'Valence-1.5.0-arm64.app.tar.gz',
    'Valence-1.5.0-amd64.deb',
    'Valence-Setup-1.5.0-x64.exe.sig',
    'latest.json',
  ])('leaves %s out of every feed', (file) => {
    expect(electronFeedOf(file, 'latest')).toBeUndefined();
  });
});
