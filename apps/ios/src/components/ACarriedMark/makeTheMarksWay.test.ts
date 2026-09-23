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
});
