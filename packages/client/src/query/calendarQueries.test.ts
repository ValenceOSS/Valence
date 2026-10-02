import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { calendarQueries } from './calendarQueries';

const fetchReleaseCalendar = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/calendar/fetchReleaseCalendar', () => ({ fetchReleaseCalendar }));

describe('calendarQueries', () => {
  it('asks for the days and whose requests', async () => {
    fetchReleaseCalendar.mockResolvedValue([]);

    await expect(
      new QueryClient().fetchQuery(calendarQueries.releases('2026-10-01', '2026-10-31', 'mine')),
    ).resolves.toEqual([]);
    expect(fetchReleaseCalendar).toHaveBeenCalledWith('2026-10-01', '2026-10-31', 'mine');
  });

  it('keys each span and audience apart, under one key that can clear them all', () => {
    const october = calendarQueries.releases('2026-10-01', '2026-10-31', 'mine').queryKey;
    const everyone = calendarQueries.releases('2026-10-01', '2026-10-31', 'everyone').queryKey;

    expect(october).not.toEqual(everyone);
    expect(october.slice(0, 1)).toEqual([...calendarQueries.key]);
  });
});
