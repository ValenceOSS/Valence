import { zoomedBy } from './zoomedBy';

const SCREEN = { width: 800, height: 400 };

describe('zoomedBy', () => {
  it('leaves a frame where it is while it is drawn at its own size', () => {
    const frame = { left: 100, top: 0, width: 600, height: 400 };

    expect(zoomedBy(frame, SCREEN, 1)).toEqual(frame);
  });

  it('grows a frame about the middle of the screen', () => {
    expect(zoomedBy({ left: 100, top: 0, width: 600, height: 400 }, SCREEN, 2)).toEqual({
      left: -200,
      top: -200,
      width: 1200,
      height: 800,
    });
  });
});
