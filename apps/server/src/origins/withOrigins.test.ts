import { describe, expect, it, vi } from 'vitest';
import { withOrigins } from '@ValenceServer/origins/withOrigins';

const NOTHING_ELSE = { title: null, titleId: null, status: null, reason: null, belongsTo: null };

describe('withOrigins', () => {
  it('says where each file Valence holds came from, and leaves the rest as they were', async () => {
    const readOrigins = vi.fn((paths: readonly string[]) =>
      Promise.resolve(
        Object.fromEntries(
          paths.map((path) => [
            path,
            { source: 'upload' as const, via: null, link: 'alone' as const },
          ]),
        ),
      ),
    );
    const describeEntries = withOrigins(
      () =>
        Promise.resolve({
          '/films/Up.mkv': { ...NOTHING_ELSE, mediaId: 'up' },
          '/films/notes.txt': { ...NOTHING_ELSE, mediaId: null },
          '/films/Up': { ...NOTHING_ELSE, mediaId: 'up' },
        }),
      readOrigins,
    );

    const described = await describeEntries([
      { name: 'Up.mkv', path: '/films/Up.mkv', isFolder: false },
      { name: 'notes.txt', path: '/films/notes.txt', isFolder: false },
      { name: 'Up', path: '/films/Up', isFolder: true },
    ]);

    expect(readOrigins).toHaveBeenCalledWith(['/films/Up.mkv']);
    expect(described['/films/Up.mkv']?.origin).toEqual({
      source: 'upload',
      via: null,
      link: 'alone',
    });
    expect(described['/films/notes.txt']?.origin).toBeUndefined();
    expect(described['/films/Up']?.origin).toBeUndefined();
  });
});
