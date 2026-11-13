import { describe, expect, it } from 'vitest';
import { directionOf } from './directionOf';

describe('directionOf', () => {
  it('runs Arabic and Hebrew right to left, and everything else left to right', () => {
    expect(directionOf('ar')).toBe('rtl');
    expect(directionOf('he')).toBe('rtl');
    expect(directionOf('fr')).toBe('ltr');
  });
});
