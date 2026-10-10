import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { fetchTheirLibraries } from './fetchTheirLibraries';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTheirLibraries', () => {
  it('reads what a linked server shares with this one', async () => {
    const asked = aServerAnswering({
      isReachable: true,
      libraries: [
        {
          id: '00000000-0000-4000-8000-0000000000f1',
          name: 'Films',
          kind: 'movies',
          isTaken: true,
        },
      ],
    });

    expect((await fetchTheirLibraries('a-server')).libraries[0]?.name).toBe('Films');
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers/a-server/their-libraries');
  });
});
