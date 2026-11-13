import { describe, expect, it } from 'vitest';
import { isUnframed } from './isUnframed';

describe('isUnframed', () => {
  it('knows a picture where it starts from one moved or drawn nearer', () => {
    expect(isUnframed({ zoom: 1, x: 0, y: 0 })).toBe(true);
    expect(isUnframed({ zoom: 1.2, x: 0, y: 0 })).toBe(false);
    expect(isUnframed({ zoom: 1, x: 0.1, y: 0 })).toBe(false);
    expect(isUnframed({ zoom: 1, x: 0, y: -0.1 })).toBe(false);
  });
});
