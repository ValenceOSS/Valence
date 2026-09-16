import { describe, expect, it } from 'vitest';
import { readReleases } from './githubRelease';
import type { GithubReleaseJson } from 'virtual:changelog';

const RELEASE: GithubReleaseJson = {
  tag_name: 'v1.0.0',
  name: 'The first release',
  body: 'Thanks @someone for the report.',
  published_at: '2026-01-05T12:00:00Z',
  html_url: 'https://github.com/MarquesCoding/Valence/releases/tag/v1.0.0',
  prerelease: false,
  draft: false,
};

describe('readReleases', () => {
  it('reads a release exactly as GitHub names it', () => {
    const [release] = readReleases([RELEASE]);

    expect(release).toMatchObject({
      version: 'v1.0.0',
      title: 'The first release',
      publishedAt: '2026-01-05',
      url: RELEASE.html_url,
      isPrerelease: false,
    });
  });

  it('drops a release still being drafted', () => {
    expect(readReleases([{ ...RELEASE, draft: true }])).toHaveLength(0);
  });

  it('titles a release by its tag when GitHub was never given a name', () => {
    const [release] = readReleases([{ ...RELEASE, name: null }]);

    expect(release?.title).toBe('v1.0.0');
  });

  it('leaves a release with no notes at all as an empty body', () => {
    const [release] = readReleases([{ ...RELEASE, body: null }]);

    expect(release?.body).toBe('');
  });

  it('says nothing was published when GitHub says the same', () => {
    const [release] = readReleases([{ ...RELEASE, published_at: null }]);

    expect(release?.publishedAt).toBeNull();
  });

  it('drops the HTML comments release tooling leaves in the body', () => {
    const [release] = readReleases([
      { ...RELEASE, body: '<!-- generated -->Actual notes.<!-- end -->' },
    ]);

    expect(release?.body).toBe('Actual notes.');
  });

  it('bolds every @mention so it reads as a name', () => {
    const [release] = readReleases([{ ...RELEASE, body: 'Thanks @someone-here.' }]);

    expect(release?.body).toBe('Thanks **@someone-here**.');
  });
});
