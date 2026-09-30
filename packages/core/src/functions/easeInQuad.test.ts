import { describe, expect, it } from 'vitest';
import { easeInQuad } from './easeInQuad';

describe('easeInQuad', () => {
  it('starts and ends where it should', () => {
    expect(easeInQuad(0)).toBe(0);
    expect(easeInQuad(1)).toBe(1);
  });

  it('is slow to leave', () => {
    expect(easeInQuad(0.5)).toBe(0.25);
  });
});
