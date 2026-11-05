import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseExtra } from './chooseExtra';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('chooseExtra', () => {
  it('puts what kind of extra a file is and whose', async () => {
    const fetching = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(
        new Response(JSON.stringify({ corrected: 1, jobId: 'job' }), { status: 200 }),
      ),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(chooseExtra('file', { extraKind: 'trailer', parentId: 'film' })).resolves.toEqual({
      kind: 'reached',
      count: 1,
      jobId: 'job',
    });
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/media/file/extra');
  });
});
