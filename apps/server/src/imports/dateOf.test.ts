import { describe, expect, it } from 'vitest';
import { dateOf } from './dateOf';

describe('dateOf', () => {
  it('reads ISO text and epoch seconds', () => {
    expect(dateOf('2026-03-04T21:00:00.0000000Z')).toEqual(new Date('2026-03-04T21:00:00Z'));
    expect(dateOf(1709586000)).toEqual(new Date(1709586000 * 1000));
  });

  it('reads the placeholders for never as nothing', () => {
    expect(dateOf('0001-01-01T00:00:00')).toBeNull();
    expect(dateOf('nonsense')).toBeNull();
    expect(dateOf('')).toBeNull();
    expect(dateOf(null)).toBeNull();
    expect(dateOf(undefined)).toBeNull();
  });
});
