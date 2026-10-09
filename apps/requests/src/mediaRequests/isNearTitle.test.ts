import { describe, expect, it } from 'vitest';
import { isNearTitle } from './isNearTitle';

describe('isNearTitle', () => {
  it('takes a title with a country or a year added', () => {
    expect(isNearTitle('The Office US', 'The Office')).toBe(true);
    expect(isNearTitle('Shameless', 'Shameless (US)')).toBe(true);
  });

  it('refuses a different title, even one that starts the same', () => {
    expect(isNearTitle('Officer Down', 'The Office')).toBe(false);
    expect(isNearTitle('', 'The Office')).toBe(false);
  });
});
