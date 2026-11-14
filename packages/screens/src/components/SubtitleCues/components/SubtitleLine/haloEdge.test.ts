import { describe, expect, it } from 'vitest';
import { haloEdge } from './haloEdge';

const OUTLINE = '0.025em 0em 0 rgba(0, 0, 0, 1.00), 0 0 0.05em rgba(0, 0, 0, 0.90)';

describe('the edge round a sign’s lettering', () => {
  it('rings dark lettering in light, in the viewer’s own shape and thickness', () => {
    expect(haloEdge(OUTLINE, '#101010')).toBe(
      '0.025em 0em 0 rgba(255, 255, 255, 1.00), 0 0 0.05em rgba(255, 255, 255, 0.90)',
    );
  });

  it('leaves light lettering in the viewer’s dark edge', () => {
    expect(haloEdge(OUTLINE, '#ffff00')).toBe(OUTLINE);
  });

  it('leaves the viewer’s own lettering in the viewer’s own edge', () => {
    expect(haloEdge(OUTLINE, null)).toBe(OUTLINE);
  });

  it('keeps a raised edge’s highlight while lightening its shadow', () => {
    expect(
      haloEdge('1px 1px 0 rgba(255, 255, 255, 0.40), 2px 2px 3px rgba(0, 0, 0, 0.90)', '#000000'),
    ).toBe('1px 1px 0 rgba(255, 255, 255, 0.40), 2px 2px 3px rgba(255, 255, 255, 0.90)');
  });

  it('draws no edge where the viewer wants none', () => {
    expect(haloEdge('none', '#000000')).toBe('none');
  });
});
