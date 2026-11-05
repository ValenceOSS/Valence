import { describe, expect, it } from 'vitest';
import { secondsOfClock } from './secondsOfClock';

describe('secondsOfClock', () => {
  it('reads hours, minutes and seconds as a clock writes them', () => {
    expect(secondsOfClock('1:02:03')).toBe(3723);
    expect(secondsOfClock(' 2:03 ')).toBe(123);
    expect(secondsOfClock('45')).toBe(45);
    expect(secondsOfClock('0:01.5')).toBe(1.5);
  });

  it('reads nothing that is not a time', () => {
    expect(secondsOfClock('')).toBeNull();
    expect(secondsOfClock('soon')).toBeNull();
    expect(secondsOfClock('1:2:3:4')).toBeNull();
  });
});
