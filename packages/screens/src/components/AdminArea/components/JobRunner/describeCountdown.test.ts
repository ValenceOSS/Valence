import { describe, expect, it } from 'vitest';
import { describeCountdown } from './describeCountdown';

describe('describeCountdown', () => {
  it('counts the last hour to the second', () => {
    expect(describeCountdown(4 * 60_000 + 7_000)).toBe('in 4m 07s');
  });

  it('counts the day in hours and minutes', () => {
    expect(describeCountdown(5 * 3_600_000 + 12 * 60_000)).toBe('in 5h 12m');
  });

  it('counts further off in days and hours', () => {
    expect(describeCountdown(3 * 86_400_000 + 4 * 3_600_000)).toBe('in 3d 4h');
  });

  it('says a run that has arrived is due', () => {
    expect(describeCountdown(0)).toBe('Due now');
  });
});
