import { afterEach, describe, expect, it, vi } from 'vitest';
import { RELEASES_URL, readDownloads } from './readDownloads';

const aRelease = (tag: string, publishedAt: string, counts: number[], over = {}) => ({
  tag_name: tag,
  draft: false,
  prerelease: false,
  published_at: publishedAt,
  assets: counts.map((download_count) => ({ download_count })),
  ...over,
});

describe('readDownloads', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('sums every release’s downloads, and lists the stable ones newest first', async () => {
    const fetching = vi.fn(() =>
      Promise.resolve(
        Response.json([
          aRelease('v1.6.0', '2026-09-01T00:00:00Z', [10, 5]),
          aRelease('v1.7.0', '2026-10-01T00:00:00Z', [3]),
          aRelease('desktop-dev', '2026-10-20T00:00:00Z', [7], { prerelease: true }),
          aRelease('v1.8.0', '2026-10-25T00:00:00Z', [100], { draft: true }),
        ]),
      ),
    );

    vi.stubGlobal('fetch', fetching);
    vi.stubEnv('GITHUB_TOKEN', 'a-token');

    expect(await readDownloads()).toStrictEqual({
      isKnown: true,
      total: 25,
      releases: [
        { tag: 'v1.7.0', publishedAt: '2026-10-01T00:00:00Z', downloads: 3 },
        { tag: 'v1.6.0', publishedAt: '2026-09-01T00:00:00Z', downloads: 15 },
      ],
    });
    expect(fetching).toHaveBeenCalledWith(`${RELEASES_URL}?per_page=100&page=1`, {
      headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer a-token' },
      next: { revalidate: 3600 },
    });
  });

  it('asks for the next page while each one is full', async () => {
    const full = Array.from({ length: 100 }, (_, at) =>
      aRelease(`v0.${at.toString()}.0`, '2026-01-01T00:00:00Z', [1]),
    );
    const fetching = vi
      .fn()
      .mockResolvedValueOnce(Response.json(full))
      .mockResolvedValueOnce(Response.json([aRelease('v1.0.0', '2026-02-01T00:00:00Z', [1])]));

    vi.stubGlobal('fetch', fetching);

    const downloads = await readDownloads();

    expect(fetching).toHaveBeenCalledTimes(2);
    expect(downloads.total).toBe(101);
    expect(downloads.releases[0]?.tag).toBe('v1.0.0');
  });

  it('says the counts are not known where GitHub cannot be asked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('rate limited', { status: 403 }))),
    );

    expect(await readDownloads()).toStrictEqual({ isKnown: false, total: 0, releases: [] });
  });

  it('says the counts are not known where GitHub answers with something else', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json({ message: 'Not Found' }))),
    );

    expect((await readDownloads()).isKnown).toBe(false);
  });

  it('says the counts are not known where the network is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('fetch failed'))),
    );

    expect((await readDownloads()).isKnown).toBe(false);
  });
});
