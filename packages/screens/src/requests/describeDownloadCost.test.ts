import { describe, expect, it } from 'vitest';
import { describeDownloadCost } from '@ValenceScreens/requests/describeDownloadCost';

const GB = 1024 ** 3;

describe('describeDownloadCost', () => {
  it('says how large the download was and how long it took', () => {
    expect(describeDownloadCost(1.4 * GB, 12 * 60)).toBe('1.4 GB in 12 min');
  });

  it('says hours and minutes for a long one, and days for a very long one', () => {
    expect(describeDownloadCost(GB, 3 * 3600 + 4 * 60)).toBe('1.0 GB in 3 h 4 min');
    expect(describeDownloadCost(GB, 2 * 3600)).toBe('1.0 GB in 2 h');
    expect(describeDownloadCost(GB, 2 * 86_400)).toBe('1.0 GB in 2 days');
    expect(describeDownloadCost(GB, 86_400)).toBe('1.0 GB in 1 day');
  });

  it('does not pretend to seconds for a quick one', () => {
    expect(describeDownloadCost(GB, 20)).toBe('1.0 GB in under a minute');
  });

  it('says its half where only one half is known', () => {
    expect(describeDownloadCost(GB, null)).toBe('1.0 GB downloaded');
    expect(describeDownloadCost(null, 600)).toBe('Downloaded in 10 min');
  });

  it('says nothing where neither is known', () => {
    expect(describeDownloadCost(null, null)).toBeNull();
  });
});
