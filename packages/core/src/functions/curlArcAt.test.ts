import { describe, expect, it } from 'vitest';
import { curlArcAt } from './curlArcAt';

describe('curlArcAt', () => {
  const from = { x: 100, y: 0 };
  const to = { x: -100, y: 0 };

  it('starts and ends where it should', () => {
    expect(curlArcAt(from, to, 30, 0)).toEqual(from);
    expect(curlArcAt(from, to, 30, 1).x).toBeCloseTo(-100);
    expect(curlArcAt(from, to, 30, 1).y).toBeCloseTo(0);
  });

  it('rises furthest halfway over', () => {
    expect(curlArcAt(from, to, 30, 0.5)).toEqual({ x: 0, y: 30 });
  });
});
