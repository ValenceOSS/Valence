import { describe, expect, it } from 'vitest';
import { updatePlatformOf } from './updatePlatformOf';

describe('updatePlatformOf', () => {
  it.each([
    ['Valence-1.4.0-arm64.app.tar.gz', 'darwin-aarch64'],
    ['Valence-1.4.0-x64.app.tar.gz', 'darwin-x86_64'],
    ['Valence-Setup-1.4.0-x64.exe', 'windows-x86_64'],
    ['Valence-Setup-1.4.0-arm64.exe', 'windows-aarch64'],
    ['Valence-1.4.0-x86_64.AppImage', 'linux-x86_64-appimage'],
    ['Valence-1.4.0-arm64.AppImage', 'linux-aarch64-appimage'],
    ['Valence-1.4.0-amd64.deb', 'linux-x86_64-deb'],
    ['Valence-1.4.0-arm64.deb', 'linux-aarch64-deb'],
    ['Valence-Setup-1.4.0-dev.12-arm64.exe', 'windows-aarch64'],
  ])('reads %s as for %s', (file, platform) => {
    expect(updatePlatformOf(file)).toBe(platform);
  });

  it('names a Linux bundle for its installer, so an app installed from a .deb is never offered an AppImage', () => {
    expect(
      ['Valence-1.4.0-x86_64.AppImage', 'Valence-1.4.0-amd64.deb'].map(updatePlatformOf),
    ).not.toContain('linux-x86_64');
  });

  it.each([
    'Valence-1.4.0-arm64.dmg',
    'Valence-1.4.0-arm64.app.tar.gz.sig',
    'Valence-Setup-1.4.0-x64.exe.sig',
    'Valence-1.4.0-riscv64.AppImage',
    'latest.json',
  ])('finds no updater for %s', (file) => {
    expect(updatePlatformOf(file)).toBeUndefined();
  });
});
