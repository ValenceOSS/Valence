import { placedPicture } from '@ValenceCore/pictures/placedPicture';
import { framedPlacement } from './framedPlacement';

const PICTURE = { width: 1600, height: 900 };

const BOX = { width: 180, height: 180 };

/**
 * Where a placement puts the picture's middle and how wide it ends up, once shifted and scaled.
 *
 * @param placed - The placement.
 * @returns Its middle and its width.
 */
const landed = (placed: ReturnType<typeof framedPlacement>) => {
  const [{ translateX }, { translateY }, { scale }] = placed.transform;

  return {
    x: placed.left + placed.width / 2 + translateX,
    y: placed.top + placed.height / 2 + translateY,
    width: placed.width * scale,
  };
};

describe('framedPlacement', () => {
  it('lands the picture where its frame puts it, however it is moved and zoomed', () => {
    const frame = { zoom: 2.5, x: 0.4, y: -0.3 };
    const expected = placedPicture(PICTURE, 1, frame);
    const placed = landed(framedPlacement(PICTURE, 1, frame, BOX));

    expect(placed.x).toBeCloseTo((expected.left + expected.width / 2) * BOX.width);
    expect(placed.y).toBeCloseTo((expected.top + expected.height / 2) * BOX.height);
    expect(placed.width).toBeCloseTo(expected.width * BOX.width);
  });

  it('keeps the picture laid out the same as it moves, so only the shift and scale change', () => {
    const one = framedPlacement(PICTURE, 1, { zoom: 1, x: 0, y: 0 }, BOX);
    const other = framedPlacement(PICTURE, 1, { zoom: 3, x: -0.5, y: 0.5 }, BOX);

    expect([other.left, other.top, other.width, other.height]).toEqual([
      one.left,
      one.top,
      one.width,
      one.height,
    ]);
  });
});
