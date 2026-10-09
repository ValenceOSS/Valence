import { describe, expect, it } from 'vitest';
import { secondsOfTimeLeft } from './secondsOfTimeLeft';

describe('secondsOfTimeLeft', () => {
  it('reads the hours, minutes and seconds an app gives, and the days before them', () => {
    expect(secondsOfTimeLeft('00:01:30')).toBe(90);
    expect(secondsOfTimeLeft('02:00:00.5000000')).toBe(7200);
    expect(secondsOfTimeLeft('1.00:00:10')).toBe(86_410);
  });

  it('says nothing where the app says nothing it can read', () => {
    expect(secondsOfTimeLeft(null)).toBeNull();
    expect(secondsOfTimeLeft(undefined)).toBeNull();
    expect(secondsOfTimeLeft('soon')).toBeNull();
  });
});
