import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLibraryProblems } from './fetchLibraryProblems';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchLibraryProblems', () => {
  it('counts the titles in each library that need a look', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ libraries: [{ libraryId: 'lib', titles: 3 }] })),
        ),
      ),
    );

    await expect(fetchLibraryProblems()).resolves.toEqual({
      libraries: [{ libraryId: 'lib', titles: 3 }],
    });
  });
});
