import { describe, expect, it } from 'vitest';
import { latestRelease } from './latestRelease';
import type { GithubReleaseJson } from 'virtual:changelog';

const release = (
  tag: string,
  assets: string[],
  extra: Partial<GithubReleaseJson> = {},
): GithubReleaseJson => ({
  tag_name: tag,
  name: tag,
  body: null,
  published_at: '2026-09-25T18:41:42Z',
  html_url: `https://github.com/ValenceOSS/Valence/releases/tag/${tag}`,
  prerelease: false,
  draft: false,
  assets: assets.map((name) => ({
    name,
    browser_download_url: `https://example.test/${name}`,
    size: 42,
  })),
  ...extra,
});

describe('latestRelease', () => {
  it('names the newest published release and finds each installer by its name', () => {
    const latest = latestRelease([
      release('v1.1.2', [
        'Valence-1.1.2-arm64.dmg',
        'Valence-1.1.2-x64.dmg',
        'Valence-Setup-1.1.2.exe',
        'Valence-1.1.2.AppImage',
      ]),
    ]);

    expect(latest?.version).toBe('v1.1.2');
    expect(latest?.publishedAt).toBe('2026-09-25');
    expect(latest?.installers.macAppleSilicon?.name).toBe('Valence-1.1.2-arm64.dmg');
    expect(latest?.installers.macIntel?.sizeBytes).toBe(42);
    expect(latest?.installers.windows?.url).toBe('https://example.test/Valence-Setup-1.1.2.exe');
    expect(latest?.installers.linux?.name).toBe('Valence-1.1.2.AppImage');
  });

  it('tells the x64 and ARM64 builds of Windows and Linux apart by name', () => {
    const latest = latestRelease([
      release('v1.4.0', [
        'Valence-Setup-1.4.0-x64.exe',
        'Valence-Setup-1.4.0-arm64.exe',
        'Valence-1.4.0-x86_64.AppImage',
        'Valence-1.4.0-arm64.AppImage',
      ]),
    ]);

    expect(latest?.installers.windows?.name).toBe('Valence-Setup-1.4.0-x64.exe');
    expect(latest?.installers.windowsArm?.name).toBe('Valence-Setup-1.4.0-arm64.exe');
    expect(latest?.installers.linux?.name).toBe('Valence-1.4.0-x86_64.AppImage');
    expect(latest?.installers.linuxArm?.name).toBe('Valence-1.4.0-arm64.AppImage');
  });

  it('has no ARM64 builds to offer from a release before there were any', () => {
    const latest = latestRelease([
      release('v1.3.0', ['Valence-Setup-1.3.0.exe', 'Valence-1.3.0.AppImage']),
    ]);

    expect(latest?.installers.windows?.name).toBe('Valence-Setup-1.3.0.exe');
    expect(latest?.installers.windowsArm).toBeNull();
    expect(latest?.installers.linux?.name).toBe('Valence-1.3.0.AppImage');
    expect(latest?.installers.linuxArm).toBeNull();
  });

  it('takes the installers from the newest release that carries any', () => {
    const latest = latestRelease([
      release('v1.1.3', []),
      release('v1.1.2', ['Valence-Setup-1.1.2.exe']),
    ]);

    expect(latest?.version).toBe('v1.1.3');
    expect(latest?.installers.windows?.name).toBe('Valence-Setup-1.1.2.exe');
    expect(latest?.installers.linux).toBeNull();
  });

  it('passes over drafts and prereleases, and answers nothing where there is no release', () => {
    expect(
      latestRelease([
        release('v2.0.0', [], { draft: true }),
        release('v1.9.0', [], { prerelease: true }),
      ]),
    ).toBeNull();
    expect(latestRelease([])).toBeNull();
  });

  it('leaves the date out where the release has none', () => {
    expect(latestRelease([release('v1.0.0', [], { published_at: null })])?.publishedAt).toBeNull();
  });
});
