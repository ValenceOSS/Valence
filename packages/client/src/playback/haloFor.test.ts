import { describe, expect, it } from 'vitest';
import { haloFor } from './haloFor';

describe('haloFor', () => {
  it('edges light lettering in dark', () => {
    expect(haloFor('#ffffff')).toBe('#000000');
    expect(haloFor('#ffff00')).toBe('#000000');
  });

  it('edges dark lettering in light, so a dark sign reads over a dark picture', () => {
    expect(haloFor('#101010')).toBe('#ffffff');
    expect(haloFor('#0000ff')).toBe('#ffffff');
  });

  it('edges the viewer’s own lettering, or anything it cannot read, in dark', () => {
    expect(haloFor(null)).toBe('#000000');
    expect(haloFor('red')).toBe('#000000');
  });
});
