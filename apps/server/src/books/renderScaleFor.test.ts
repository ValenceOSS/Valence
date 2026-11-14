import { describe, expect, it } from 'vitest';
import { renderScaleFor } from './renderScaleFor';

describe('renderScaleFor', () => {
  it('draws an ordinary page at the scale wanted', () => {
    expect(renderScaleFor([0, 0, 595, 842], 2)).toBe(2);
  });

  it('draws a page of fourteen thousand points on a side at a scale that fits the budget', () => {
    const scale = renderScaleFor([0, 0, 14_400, 14_400], 2);

    expect(scale).not.toBeNull();
    expect((scale ?? 0) * 14_400 * ((scale ?? 0) * 14_400)).toBeLessThanOrEqual(40_000_001);
  });

  it('draws nothing of a page with no size or an unreadable one', () => {
    expect(renderScaleFor([0, 0, 0, 842], 2)).toBeNull();
    expect(renderScaleFor([0, 0, Number.NaN, 842], 2)).toBeNull();
  });
});
