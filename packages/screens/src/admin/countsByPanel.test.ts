import { describe, expect, it } from 'vitest';
import { countsByPanel } from './countsByPanel';

describe('countsByPanel', () => {
  it('puts each count on the page it is dealt with in, failures marked urgent', () => {
    const counts = countsByPanel({
      requests: 2,
      failedRequests: 5,
      downloads: 1,
      jobs: 3,
      health: 4,
      latest: null,
    });

    expect(counts.requests).toEqual({ count: 2, isUrgent: false });
    expect(counts.jobs).toEqual({ count: 3, isUrgent: true });
    expect(counts.media?.count).toBe(4);
  });

  it('counts failed requests on the catalogue, where they are listed, not on downloads', () => {
    const counts = countsByPanel({
      requests: 0,
      failedRequests: 2,
      downloads: 0,
      jobs: 0,
      health: 0,
      latest: null,
    });

    expect(counts.catalogue).toEqual({ count: 2, isUrgent: true });
    expect(counts.downloads).toEqual({ count: 0, isUrgent: true });
  });
});
