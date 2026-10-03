import { describe, expect, it } from 'vitest';
import { readClock } from './readClock';

describe('readClock', () => {
  it('reads a time of day typed as hours and minutes', () => {
    expect(readClock('03:00')).toEqual({ hour: 3, minute: 0 });
    expect(readClock('23:59')).toEqual({ hour: 23, minute: 59 });
    expect(readClock('7:05')).toEqual({ hour: 7, minute: 5 });
  });

  it('answers nothing for a time that is not one', () => {
    expect(readClock('24:00')).toBeNull();
    expect(readClock('12:60')).toBeNull();
    expect(readClock('')).toBeNull();
    expect(readClock('noon')).toBeNull();
  });
});
