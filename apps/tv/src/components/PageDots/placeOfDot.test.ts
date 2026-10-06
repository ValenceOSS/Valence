import { PAGE_DOT } from '@ValenceTv/components/PageDots/PAGE_DOT';
import { placeOfDot } from '@ValenceTv/components/PageDots/placeOfDot';

describe('placeOfDot', () => {
  const step = PAGE_DOT.size + PAGE_DOT.gap;

  it('draws the current dot long, and moves the ones after it along', () => {
    expect(placeOfDot(0, 1)).toEqual({ x: 0, width: 12 });
    expect(placeOfDot(1, 1)).toEqual({ x: step, width: 56 });
    expect(placeOfDot(2, 1)).toEqual({ x: 2 * step + 44, width: 12 });
  });
});
