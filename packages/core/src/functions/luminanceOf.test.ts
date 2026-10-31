import { describe, expect, it } from 'vitest';
import { luminanceOf } from './luminanceOf';

describe('luminanceOf', () => {
  it('runs from black to white', () => {
    expect(luminanceOf('#000000')).toBe(0);
    expect(luminanceOf('#ffffff')).toBeCloseTo(1);
  });

  it('weighs green as brighter than blue', () => {
    expect(luminanceOf('rgb(0, 255, 0)')).toBeGreaterThan(luminanceOf('rgb(0, 0, 255)') ?? 1);
  });

  it('gives nothing for a colour it cannot read', () => {
    expect(luminanceOf('tomato')).toBeNull();
  });
});
