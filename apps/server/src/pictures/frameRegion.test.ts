import { describe, expect, it } from 'vitest';
import { frameRegion } from './frameRegion';

describe('frameRegion', () => {
  it('shows the largest square in the middle of a picture that is not framed', () => {
    expect(frameRegion(1000, 2000, null)).toEqual({ left: 0, top: 500, width: 1000, height: 1000 });
    expect(frameRegion(3000, 2000, null)).toEqual({ left: 500, top: 0, width: 2000, height: 2000 });
  });

  it('draws nearer by the zoom, still in the middle', () => {
    expect(frameRegion(1000, 1000, { zoom: 2, x: 0, y: 0 })).toEqual({
      left: 250,
      top: 250,
      width: 500,
      height: 500,
    });
  });

  it('slides as far as the zoom leaves room to and no further', () => {
    expect(frameRegion(1000, 1000, { zoom: 2, x: 1, y: -1 })).toEqual({
      left: 500,
      top: 0,
      width: 500,
      height: 500,
    });
    expect(frameRegion(1000, 1000, { zoom: 2, x: -1, y: 1 })).toEqual({
      left: 0,
      top: 500,
      width: 500,
      height: 500,
    });
  });

  it('slides by the shorter edge, as the circle is, on a tall picture', () => {
    expect(frameRegion(1000, 2000, { zoom: 2, x: 0, y: 1 })).toEqual({
      left: 250,
      top: 1000,
      width: 500,
      height: 500,
    });
  });

  it('never runs off a picture, however it is rounded', () => {
    const region = frameRegion(333, 777, { zoom: 3.7, x: 1, y: 1 });

    expect(region.left + region.width).toBeLessThanOrEqual(333);
    expect(region.top + region.height).toBeLessThanOrEqual(777);
  });
});
