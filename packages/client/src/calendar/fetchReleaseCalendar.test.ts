import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchReleaseCalendar } from './fetchReleaseCalendar';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchReleaseCalendar', () => {
  it('asks for the days and whose requests, and hands back the entries', async () => {
    const asked: string[] = [];

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        asked.push(url);

        return Promise.resolve(Response.json({ entries: [] }));
      }),
    );

    await expect(fetchReleaseCalendar('2026-10-01', '2026-10-31', 'everyone')).resolves.toEqual([]);
    expect(asked[0]).toContain('/api/calendar?from=2026-10-01&to=2026-10-31&who=everyone');
  });
});
