import { describe, expect, it } from 'vitest';
import { countsByPanel } from './countsByPanel';

describe('countsByPanel', () => {
  it('puts each count on the page it is dealt with in, failures marked urgent', () => {
    const counts = countsByPanel({ requests: 2, downloads: 1, jobs: 3, health: 4, latest: null });

    expect(counts.requests).toEqual({ count: 2, isUrgent: false });
    expect(counts.jobs).toEqual({ count: 3, isUrgent: true });
    expect(counts.media?.count).toBe(4);
  });
});
