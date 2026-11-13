import { describe, expect, it } from 'vitest';
import { movedFrame } from './movedFrame';

const WIDE = { width: 2000, height: 1000 };

describe('movedFrame', () => {
  it('brings more of the left into view as the picture is dragged right', () => {
    expect(movedFrame({ zoom: 1, x: 0, y: 0 }, { x: 0.25, y: 0 }, WIDE, 1)).toEqual({
      zoom: 1,
      x: -0.5,
      y: 0,
    });
  });

  it('goes no further than the picture’s edges', () => {
    expect(movedFrame({ zoom: 1, x: 0, y: 0 }, { x: -3, y: 0 }, WIDE, 1)).toEqual({
      zoom: 1,
      x: 1,
      y: 0,
    });
  });

  it('keeps still along a side with no room to move', () => {
    expect(movedFrame({ zoom: 1, x: 0, y: 0 }, { x: 0, y: 0.5 }, WIDE, 1)).toEqual({
      zoom: 1,
      x: 0,
      y: 0,
    });
  });

  it('moves up and down once drawn nearer', () => {
    expect(movedFrame({ zoom: 2, x: 0, y: 0 }, { x: 0, y: -0.5 }, WIDE, 1).y).toBe(1);
  });
});
