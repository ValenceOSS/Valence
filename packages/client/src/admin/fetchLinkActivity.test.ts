import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { fetchLinkActivity } from './fetchLinkActivity';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchLinkActivity', () => {
  it('reads the record of what a linked server asked for', async () => {
    const asked = aServerAnswering({
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

    expect((await fetchLinkActivity('a-server'))[0]?.count).toBe(2);
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers/a-server/activity');
  });
});
