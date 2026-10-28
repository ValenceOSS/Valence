import { describe, expect, it } from 'vitest';
import { describeTimeTaken } from './describeTimeTaken';

const FROM = '2026-10-09T17:00:00.000Z';

/**
 * The moment the given number of seconds after the start.
 */
const after = (seconds: number): string =>
  new Date(Date.parse(FROM) + seconds * 1000).toISOString();

describe('describeTimeTaken', () => {
  it('says seconds for under a minute', () => {
    expect(describeTimeTaken(FROM, after(12))).toBe('12s');
  });

  it('says whole minutes for under an hour', () => {
    expect(describeTimeTaken(FROM, after(4 * 60 + 30))).toBe('4m');
  });

  it('says hours and minutes for under a day', () => {
    expect(describeTimeTaken(FROM, after(84 * 60))).toBe('1h 24m');
  });

  it('says days and hours for a day or more', () => {
    expect(describeTimeTaken(FROM, after((2 * 24 + 3) * 3600 + 59 * 60))).toBe('2d 3h');
  });

  it('never says less than a second, even backwards', () => {
    expect(describeTimeTaken(FROM, FROM)).toBe('1s');
    expect(describeTimeTaken(after(10), FROM)).toBe('1s');
  });
});
