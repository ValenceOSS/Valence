import { describe, expect, it } from 'vitest';
import { placedPicture } from './placedPicture';

describe('placedPicture', () => {
  it('draws a wide picture twice the box’s width, slid to show the part chosen', () => {
    expect(placedPicture({ width: 2000, height: 1000 }, 1, { zoom: 1, x: 1, y: 0 })).toEqual({
      left: -1,
      top: -0,
      width: 2,
      height: 1,
    });
  });

  it('draws a picture left alone with its middle in the box', () => {
    expect(placedPicture({ width: 1000, height: 3000 }, 1, null)).toEqual({
      left: -0,
      top: -1,
      width: 1,
      height: 3,
    });
  });
});
