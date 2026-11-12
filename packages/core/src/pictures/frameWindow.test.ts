import { describe, expect, it } from 'vitest';
import { frameWindow } from './frameWindow';

describe('frameWindow', () => {
  it('shows the middle of a picture left alone, as large as the shape allows', () => {
    expect(frameWindow(2000, 1000, 1, null)).toEqual({
      left: 500,
      top: 0,
      width: 1000,
      height: 1000,
    });
    expect(frameWindow(1000, 3000, 1, { zoom: 1, x: 0, y: 0 })).toEqual({
      left: 0,
      top: 1000,
      width: 1000,
      height: 1000,
    });
  });

  it('slides a wide picture all the way across without drawing it nearer', () => {
    expect(frameWindow(2000, 1000, 1, { zoom: 1, x: -1, y: 0 }).left).toBe(0);
    expect(frameWindow(2000, 1000, 1, { zoom: 1, x: 1, y: 0 }).left).toBe(1000);
  });

  it('draws nearer by the zoom, and slides within what is left', () => {
    expect(frameWindow(1000, 1000, 1, { zoom: 2, x: 1, y: -1 })).toEqual({
      left: 500,
      top: 0,
      width: 500,
      height: 500,
    });
  });

  it('cuts the shape asked for', () => {
    expect(frameWindow(1600, 900, 2 / 3, null)).toEqual({
      left: 500,
      top: 0,
      width: 600,
      height: 900,
    });
    expect(frameWindow(1000, 1000, 16 / 9, null)).toEqual({
      left: 0,
      top: 218.75,
      width: 1000,
      height: 562.5,
    });
  });

  it('frames a square picture just as it was framed before the shape was considered', () => {
    const zoom = 2.5;
    const shorter = 800;
    const slide = ((zoom - 1) / (2 * zoom)) * shorter;
    const side = shorter / zoom;

    expect(frameWindow(800, 800, 1, { zoom, x: 0.4, y: -0.2 })).toEqual({
      left: 400 + 0.4 * slide - side / 2,
      top: 400 - 0.2 * slide - side / 2,
      width: side,
      height: side,
    });
  });
});
