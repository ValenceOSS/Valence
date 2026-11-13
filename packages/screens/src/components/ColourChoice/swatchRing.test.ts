import { describe, expect, it } from 'vitest';
import { swatchRing } from './swatchRing';

describe('swatchRing', () => {
  it('rings the chosen swatch in the accent', () => {
    expect(swatchRing(true)).toContain('ring-primary');
    expect(swatchRing(true)).not.toContain('hover:ring-text/25');
  });

  it('rings any other faintly only while it is pointed at, as it grows', () => {
    expect(swatchRing(false)).toContain('hover-hover:hover:ring-text/25');
    expect(swatchRing(false)).toContain('hover-hover:hover:scale-110');
    expect(swatchRing(false)).not.toContain('ring-primary');
  });
});
