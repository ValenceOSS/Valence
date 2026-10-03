import { afterEach, describe, expect, it, vi } from 'vitest';
import { leaveOut } from './leaveOut';

const LEFT = {
  id: 'left-1',
  libraryId: 'library-1',
  path: '/media/films/Broken.mkv',
  isFolder: false,
  note: 'Stutters',
  createdAt: '2026-10-03T12:00:00.000Z',
  createdBy: null,
};

describe('leaveOut', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the path and why, and answers what is left out', async () => {
    const fetching = vi.fn((_path: string, _init: RequestInit) =>
      Promise.resolve(Response.json({ leftOut: LEFT, jobId: 'job-1' }, { status: 201 })),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(leaveOut('library-1', '/media/films/Broken.mkv', 'Stutters')).resolves.toEqual({
      leftOut: LEFT,
      jobId: 'job-1',
    });
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/libraries/library-1/left-out');
    expect(fetching.mock.calls[0]?.[1].body).toBe(
      JSON.stringify({ path: '/media/films/Broken.mkv', note: 'Stutters' }),
    );
  });

  it('fails with the server’s own words where it refuses', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        Response.json({ error: 'That is not inside this library.' }, { status: 400 }),
      ),
    );

    await expect(leaveOut('library-1', '/elsewhere', null)).rejects.toThrow(
      'That is not inside this library.',
    );
  });
});
