import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLeftOut } from './fetchLeftOut';

const LEFT = {
  id: 'left-1',
  libraryId: 'library-1',
  path: '/media/films/Broken.mkv',
  isFolder: false,
  note: 'Stutters',
  createdAt: '2026-10-03T12:00:00.000Z',
  createdBy: null,
};

describe('fetchLeftOut', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads what is left out of the library it is asked about', async () => {
    const fetching = vi.fn(() => Promise.resolve(Response.json([LEFT])));

    vi.stubGlobal('fetch', fetching);

    await expect(fetchLeftOut('library-1')).resolves.toEqual([LEFT]);
    expect(fetching).toHaveBeenCalledWith('/api/libraries/library-1/left-out', expect.anything());
  });

  it('fails where the server refuses, so the list says it could not be read', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(Response.json({}, { status: 403 })));

    await expect(fetchLeftOut('library-1')).rejects.toThrow();
  });
});
