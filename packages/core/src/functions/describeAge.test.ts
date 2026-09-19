import { describe, expect, it } from 'vitest';
import { describeAge } from './describeAge';

const NOW = Date.parse('2026-09-19T12:00:00.000Z');

describe('describeAge', () => {
  it.each([
    ['2026-09-19T11:59:50.000Z', '1 minute'],
    ['2026-09-19T11:30:00.000Z', '30 minutes'],
    ['2026-09-19T11:00:00.000Z', '1 hour'],
    ['2026-09-19T01:00:00.000Z', '11 hours'],
    ['2026-09-18T12:00:00.000Z', '1 day'],
    ['2026-08-01T12:00:00.000Z', '49 days'],
    ['2026-05-19T12:00:00.000Z', '4 months'],
    ['2023-09-19T12:00:00.000Z', '3 years'],
  ])('says something posted at %s is %s old', (when, said) => {
    expect(describeAge(when, NOW)).toBe(said);
  });

  it('says a moment in the future is a minute old rather than a negative age', () => {
    expect(describeAge('2026-09-19T13:00:00.000Z', NOW)).toBe('1 minute');
  });

  it('says nothing about a moment it cannot read', () => {
    expect(describeAge('not a date', NOW)).toBeNull();
  });
});
