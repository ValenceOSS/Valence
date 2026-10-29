import { beforeEach, describe, expect, it, vi } from 'vitest';
import { someStats } from '@ValenceMetrics/testing/someStats';
import { FRESH_FOR, readCachedStats } from './readCachedStats';
import { readStats } from './readStats';

vi.mock('@ValenceMetrics/db/openDatabase', () => ({ openDatabase: vi.fn(() => ({})) }));

vi.mock('./readStats', () => ({ readStats: vi.fn() }));

const A_DAY_LATER = 24 * 60 * 60 * 1000;

describe('readCachedStats', () => {
  beforeEach(() => {
    vi.mocked(readStats).mockReset();
  });

  it('reads the figures once, and again only after five minutes', async () => {
    const now = new Date('2026-10-29T12:00:00Z');

    vi.mocked(readStats).mockResolvedValue(someStats());

    await readCachedStats(now);
    await readCachedStats(new Date(now.getTime() + FRESH_FOR - 1));

    expect(readStats).toHaveBeenCalledTimes(1);

    await readCachedStats(new Date(now.getTime() + FRESH_FOR));

    expect(readStats).toHaveBeenCalledTimes(2);
  });

  it('reads again straight away after a reading fails', async () => {
    const now = new Date(new Date('2026-10-29T12:00:00Z').getTime() + A_DAY_LATER);

    vi.mocked(readStats).mockRejectedValueOnce(new Error('no database'));
    vi.mocked(readStats).mockResolvedValueOnce(someStats());

    await expect(readCachedStats(now)).rejects.toThrow('no database');
    await expect(readCachedStats(now)).resolves.toStrictEqual(someStats());
  });
});
