import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { fetchTheirActivity } from './fetchTheirActivity';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTheirActivity', () => {
  it('reads a linked server’s record of this one’s people, or why there is none', async () => {
    aServerAnswering({
      standing: 'shown',
      entries: [
        {
          id: '00000000-0000-4000-8000-000000000004',
          at: '2026-10-02T12:00:00.000Z',
          personId: null,
          personName: null,
          action: 'libraries',
          mediaTitle: null,
          outcome: 'allowed',
          count: 2,
        },
      ],
    });

    expect((await fetchTheirActivity('a-server')).entries).toHaveLength(1);

    aServerAnswering({ standing: 'notShown', entries: [] });

    expect((await fetchTheirActivity('a-server')).standing).toBe('notShown');
  });
});
