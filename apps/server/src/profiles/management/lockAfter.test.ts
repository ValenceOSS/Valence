import { describe, expect, it } from 'vitest';
import { lockAfter } from './lockAfter';

const NOW = Date.parse('2026-10-15T12:00:00.000Z');

const minutesLocked = (failures: number): number | null => {
  const until = lockAfter(failures, NOW);

  return until === null ? null : (until.getTime() - NOW) / 60_000;
};

describe('lockAfter', () => {
  it('lets somebody go on trying until five wrong in a row', () => {
    expect([1, 2, 3, 4].map(minutesLocked)).toEqual([null, null, null, null]);
  });

  it('has nothing to lock before any wrong try', () => {
    expect(lockAfter(0, NOW)).toBeNull();
  });

  it('locks for a minute, then five, then fifteen, after each five more', () => {
    expect([5, 10, 15].map(minutesLocked)).toEqual([1, 5, 15]);
  });

  it('locks for an hour at a time from the twentieth wrong try on', () => {
    expect([20, 25, 50, 500].map(minutesLocked)).toEqual([60, 60, 60, 60]);
  });

  it('lets the tries in between a lock go on without locking again', () => {
    expect([6, 7, 8, 9, 11, 21].map(minutesLocked)).toEqual([null, null, null, null, null, null]);
  });

  it('counts from the time it is given', () => {
    expect(lockAfter(5, 0)?.getTime()).toBe(60_000);
  });
});
