import { cardSizes } from '@ValenceTv/components/MediaCard/cardSizes';

describe('cardSizes', () => {
  it('draws a wide card at sixteen by nine', () => {
    expect(cardSizes.wide).toEqual({ width: 420, height: 236 });
    expect(cardSizes.wide.width / cardSizes.wide.height).toBeCloseTo(16 / 9, 1);
  });

  it('draws a poster at two by three', () => {
    expect(cardSizes.poster).toEqual({ width: 240, height: 360 });
    expect(cardSizes.poster.width / cardSizes.poster.height).toBeCloseTo(2 / 3, 5);
  });
});
