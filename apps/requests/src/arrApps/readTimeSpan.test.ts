import { describe, expect, it } from 'vitest';
import { readTimeSpan } from './readTimeSpan';

describe('readTimeSpan', () => {
  it('reads hours, minutes and seconds, with days in front where there are any', () => {
    expect(readTimeSpan('00:10:00')).toBe(600);
    expect(readTimeSpan('1.02:03:04')).toBe(93_784);
    expect(readTimeSpan('00:00:05.1234567')).toBe(5);
  });

  it('has nothing to say of a time span that is not there or not one', () => {
    expect(readTimeSpan(null)).toBeNull();
    expect(readTimeSpan(undefined)).toBeNull();
    expect(readTimeSpan('soon')).toBeNull();
  });
});
