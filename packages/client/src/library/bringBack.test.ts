import { afterEach, describe, expect, it, vi } from 'vitest';
import { bringBack } from './bringBack';

const LEFT = {
  id: 'left-1',
  libraryId: 'library-1',
  path: '/media/films/Broken.mkv',
  isFolder: false,
  note: 'Stutters',
  createdAt: '2026-10-03T12:00:00.000Z',
  createdBy: null,
};

describe('bringBack', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('forgets what was left out, and answers what came back', async () => {
    const fetching = vi.fn((_path: string, _init: RequestInit) =>
      Promise.resolve(Response.json({ leftOut: LEFT, jobId: null })),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(bringBack('library-1', 'left-1')).resolves.toEqual({ leftOut: LEFT, jobId: null });
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/libraries/library-1/left-out/left-1');
    expect(fetching.mock.calls[0]?.[1].method).toBe('DELETE');
  });
});
