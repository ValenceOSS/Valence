import { describe, expect, it } from 'vitest';
import { describeSpan } from './describeSpan';

describe('describeSpan', () => {
  it('says a feature in hours and minutes', () => {
    expect(describeSpan(7_530)).toBe('2h 6m');
  });

  it('drops the hours from something under one', () => {
    expect(describeSpan(2_700)).toBe('45m');
  });

  it('says something shorter than a minute in seconds, rather than rounding it to nothing', () => {
    expect(describeSpan(12)).toBe('12s');
  });

  it('has nothing to say about a length nobody knows', () => {
    expect(describeSpan(null)).toBeNull();
  });

  it('has nothing to say about no time at all', () => {
    expect(describeSpan(0)).toBeNull();
  });
});
