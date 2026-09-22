import { howBigToDrawIt } from './howBigToDrawIt';

const SCREEN = { width: 900, height: 400 };

const ROOM = { top: 0, bottom: 20, left: 60, right: 60 };

const NONE = { top: 0, bottom: 0, left: 0, right: 0 };

const WIDE = { width: 1920, height: 1080 };

describe('howBigToDrawIt', () => {
  it('draws it at its own size where it may reach the edges', () => {
    expect(howBigToDrawIt('edge', SCREEN, ROOM, WIDE)).toBe(1);
  });

  it('shrinks it clear of what the phone put over the screen', () => {
    expect(howBigToDrawIt('safe', SCREEN, ROOM, WIDE)).toBeCloseTo(0.8667, 4);
  });

  it('shrinks by whichever side is tightest, not by the first one', () => {
    expect(howBigToDrawIt('safe', SCREEN, { ...NONE, top: 100 }, WIDE)).toBeCloseTo(0.75, 3);
  });

  it('leaves it alone on a phone with nothing over its screen', () => {
    expect(howBigToDrawIt('safe', SCREEN, NONE, WIDE)).toBe(1);
  });

  it('grows it until there is no black left', () => {
    expect(
      howBigToDrawIt('full', { width: 800, height: 400 }, NONE, { width: 1000, height: 1000 }),
    ).toBe(2);
  });

  it('grows a wide film less on a wide screen, since there is less black to lose', () => {
    expect(howBigToDrawIt('full', { width: 1000, height: 500 }, NONE, WIDE)).toBeCloseTo(1.125, 3);
  });

  it('leaves a film already the shape of the screen alone', () => {
    expect(howBigToDrawIt('full', { width: 960, height: 540 }, NONE, WIDE)).toBe(1);
  });

  it('draws it at its own size before the film has said what shape it is', () => {
    expect(howBigToDrawIt('full', SCREEN, ROOM, null)).toBe(1);
  });

  it('draws it at its own size before the screen has been measured', () => {
    expect(howBigToDrawIt('safe', { width: 0, height: 0 }, ROOM, WIDE)).toBe(1);
  });

  it('manages a film that claims no size at all', () => {
    expect(howBigToDrawIt('full', SCREEN, NONE, { width: 0, height: 0 })).toBe(1);
  });
});
