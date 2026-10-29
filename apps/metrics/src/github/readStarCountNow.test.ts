import { afterEach, describe, expect, it, vi } from 'vitest';
import { REPOSITORY_API_URL, readStarCountNow } from './readStarCountNow';

describe('readStarCountNow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('reads the star count from GitHub, asking again at most once an hour', async () => {
    const fetching = vi.fn(() => Promise.resolve(Response.json({ stargazers_count: 235 })));

    vi.stubGlobal('fetch', fetching);
    vi.stubEnv('GITHUB_TOKEN', '');

    expect(await readStarCountNow()).toBe(235);
    expect(fetching).toHaveBeenCalledWith(REPOSITORY_API_URL, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 3600 },
    });
  });

  it('says it is not known where GitHub cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );

    expect(await readStarCountNow()).toBeNull();
  });

  it('says it is not known where GitHub turns the request away', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 403 }))),
    );

    expect(await readStarCountNow()).toBeNull();
  });

  it('says it is not known where GitHub answers with something else', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json({ stars: 'many' }))),
    );

    expect(await readStarCountNow()).toBeNull();
  });
});
