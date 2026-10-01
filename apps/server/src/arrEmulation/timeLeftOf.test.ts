import { describe, expect, it } from 'vitest';
import { timeLeftOf } from './timeLeftOf';

describe('timeLeftOf', () => {
  it('writes hours, minutes and seconds two digits each', () => {
    expect(timeLeftOf(3723)).toBe('01:02:03');
  });

  it('writes nothing left as noughts', () => {
    expect(timeLeftOf(0)).toBe('00:00:00');
  });

  it('lets the hours run past a day', () => {
    expect(timeLeftOf(100 * 3600)).toBe('100:00:00');
  });
});
