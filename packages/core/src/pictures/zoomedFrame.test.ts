import { describe, expect, it } from 'vitest';
import { frameWindow } from './frameWindow';
import { zoomedFrame } from './zoomedFrame';

const WIDE = { width: 2000, height: 1000 };

const middleOf = (window: { left: number; top: number; width: number; height: number }) => ({
  x: window.left + window.width / 2,
  y: window.top + window.height / 2,
});

describe('zoomedFrame', () => {
  it('keeps the same point in the middle as it draws nearer', () => {
    const was = { zoom: 1, x: -0.5, y: 0 };
    const now = zoomedFrame(was, 2, WIDE, 1, 4);

    expect(now.zoom).toBe(2);
    expect(middleOf(frameWindow(2000, 1000, 1, now))).toEqual(
      middleOf(frameWindow(2000, 1000, 1, was)),
    );
  });

  it('keeps within the edges as it draws back out', () => {
    expect(zoomedFrame({ zoom: 3, x: 0, y: 1 }, 1, WIDE, 1, 4)).toEqual({ zoom: 1, x: 0, y: 0 });
  });

  it('draws no nearer than a frame allows, and no further than the whole shape', () => {
    expect(zoomedFrame({ zoom: 1, x: 0, y: 0 }, 9, WIDE, 1, 4).zoom).toBe(4);
    expect(zoomedFrame({ zoom: 2, x: 0, y: 0 }, 0.2, WIDE, 1, 4).zoom).toBe(1);
  });
});
