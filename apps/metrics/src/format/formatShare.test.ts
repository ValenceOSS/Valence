import { describe, expect, it } from 'vitest';
import { formatShare } from './formatShare';

describe('formatShare', () => {
  it('writes a share as a percentage to one place', () => {
    expect(formatShare(0.5)).toBe('50.0%');
    expect(formatShare(0.12345)).toBe('12.3%');
    expect(formatShare(0)).toBe('0.0%');
  });

  it('says a share too small to show is less than a tenth of a percent', () => {
    expect(formatShare(0.0001)).toBe('<0.1%');
  });
});
