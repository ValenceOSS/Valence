import { describe, expect, it } from 'vitest';
import { isAPin } from './isAPin';

describe('isAPin', () => {
  it('takes four to eight digits', () => {
    expect(isAPin('1234')).toBe(true);
    expect(isAPin('12345678')).toBe(true);
  });

  it('refuses too few, too many, or anything but digits', () => {
    expect(isAPin('123')).toBe(false);
    expect(isAPin('123456789')).toBe(false);
    expect(isAPin('12a4')).toBe(false);
    expect(isAPin(' 1234')).toBe(false);
  });
});
