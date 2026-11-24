import { describe, expect, it } from 'vitest';
import { seasonOn } from './seasonOn';

describe('seasonOn', () => {
  it.each([
    [new Date(2026, 8, 30), null],
    [new Date(2026, 9, 1), 'halloween'],
    [new Date(2026, 9, 31), 'halloween'],
    [new Date(2026, 10, 1), 'christmas'],
    [new Date(2026, 11, 25), 'christmas'],
    [new Date(2026, 11, 26), 'christmas'],
    [new Date(2026, 11, 27), null],
    [new Date(2027, 0, 1), null],
    [new Date(2027, 6, 4), null],
  ])('names the season of %s as %s', (day, season) => {
    expect(seasonOn(day)).toBe(season);
  });
});
