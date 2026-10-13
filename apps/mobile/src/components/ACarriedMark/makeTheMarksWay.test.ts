import { makeTheMarksWay } from './makeTheMarksWay';

const AT = { x: 10, y: 20, width: 100, height: 40 };

describe('makeTheMarksWay', () => {
  it('knows whether the mark has been shown yet', () => {
    const way = makeTheMarksWay();

    expect(way.hasShown()).toBe(false);
    way.markShown();
    expect(way.hasShown()).toBe(true);
  });

  it('lands nowhere until something will carry the mark', () => {
    expect(makeTheMarksWay().land(AT, jest.fn())).toBe(false);
  });

  it('hands where the mark left and lands to whatever carries it', () => {
    const way = makeTheMarksWay();
    const flyer = { leave: jest.fn(), land: jest.fn(() => true) };
    const whenThere = jest.fn();

    way.flyWith(flyer);
    way.leave(AT);

    expect(flyer.leave).toHaveBeenCalledWith(AT);
    expect(way.land(AT, whenThere)).toBe(true);
    expect(flyer.land).toHaveBeenCalledWith(AT, whenThere);
  });

  it('keeps a mark waiting while the splash holds it, then flies it from the splash', () => {
    const way = makeTheMarksWay();
    const flyer = { leave: jest.fn(), land: jest.fn(() => true) };
    const whenThere = jest.fn();
    const SPLASH = { x: 150, y: 400, width: 76, height: 56 };

    way.flyWith(flyer);
    way.hold();
    way.leave(AT);

    expect(way.land(AT, whenThere)).toBe(true);
    expect(flyer.leave).not.toHaveBeenCalled();
    expect(way.hasShown()).toBe(true);

    way.release(SPLASH);

    expect(flyer.leave).toHaveBeenCalledWith(SPLASH);
    expect(flyer.land).toHaveBeenCalledWith(AT, whenThere);
  });

  it('shows the waiting mark at once where nothing can fly it', () => {
    const way = makeTheMarksWay();
    const whenThere = jest.fn();

    way.hold();
    way.land(AT, whenThere);
    way.release(AT);

    expect(whenThere).toHaveBeenCalled();
  });
});
