import { afterEach, describe, expect, it, vi } from 'vitest';
import { renameToPattern } from './renameToPattern';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('renameToPattern', () => {
  it('posts the files and what to do where a name is taken', async () => {
    const fetching = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(
        new Response(JSON.stringify({ renamed: 2, skipped: 1, jobId: 'j' }), { status: 200 }),
      ),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(renameToPattern(['m1', 'm2'], 'number')).resolves.toEqual({
      renamed: 2,
      skipped: 1,
      jobId: 'j',
    });
    expect(fetching.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ mediaIds: ['m1', 'm2'], whenTaken: 'number' }),
    });
  });

  it('throws what the server refused with', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ error: 'No' }), { status: 403 }))),
    );

    await expect(renameToPattern(['m1'], 'skip')).rejects.toThrow('No');
  });
});
