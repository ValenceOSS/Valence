import { describe, expect, it } from 'vitest';
import { LOG_RANGES, logRangeStart } from './logRanges';

describe('logRangeStart', () => {
  it('starts a range that far before now', () => {
    expect(logRangeStart('1h', 10_000_000)).toBe(10_000_000 - 3_600_000);
    expect(logRangeStart('7d', 10_000_000_000)).toBe(10_000_000_000 - 7 * 86_400_000);
  });

  it('gives everything kept no start at all', () => {
    expect(logRangeStart('all', 10_000_000)).toBeNull();
  });
});

describe('LOG_RANGES', () => {
  it('runs from the shortest to the longest, ending with everything', () => {
    const lengths = LOG_RANGES.map((range) => range.ms ?? Infinity);

    expect(lengths).toStrictEqual([...lengths].sort((one, other) => one - other));
    expect(LOG_RANGES.at(-1)?.id).toBe('all');
  });

  it('has a distinct id and label for each', () => {
    expect(new Set(LOG_RANGES.map((range) => range.id)).size).toBe(LOG_RANGES.length);
    expect(new Set(LOG_RANGES.map((range) => range.label)).size).toBe(LOG_RANGES.length);
  });
});
