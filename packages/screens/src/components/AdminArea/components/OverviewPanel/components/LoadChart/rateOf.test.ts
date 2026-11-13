import { describe, expect, it } from 'vitest';
import { rateOf } from './rateOf';

describe('rateOf', () => {
  it('writes a rate as a size a second', () => {
    expect(rateOf(2_048)).toMatch(/\/s$/);
  });

  it('writes a dash, never zero, where the rate is unknown', () => {
    expect(rateOf(null)).toBe('—');
    expect(rateOf(undefined)).toBe('—');
  });
});
