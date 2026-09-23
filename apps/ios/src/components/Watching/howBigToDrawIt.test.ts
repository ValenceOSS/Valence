import { howBigToDrawIt } from './howBigToDrawIt';

const SCREEN = { width: 900, height: 400 };

const ROOM = { top: 0, bottom: 20, left: 60, right: 60 };

const NONE = { top: 0, bottom: 0, left: 0, right: 0 };

describe('howBigToDrawIt', () => {
  it('draws it at its own size where it may reach the edges', () => {
    expect(howBigToDrawIt('edge', SCREEN, ROOM)).toBe(1);
  });

  it('shrinks it clear of what the phone put over the screen', () => {
    expect(howBigToDrawIt('safe', SCREEN, ROOM)).toBeCloseTo(0.8667, 4);
  });

  it('shrinks by whichever side is tightest, not by the first one', () => {
    expect(howBigToDrawIt('safe', SCREEN, { ...NONE, top: 100 })).toBeCloseTo(0.75, 3);
  });

  it('leaves it alone on a phone with nothing over its screen', () => {
    expect(howBigToDrawIt('safe', SCREEN, NONE)).toBe(1);
  });

  it('draws it at its own size before the screen has been measured', () => {
    expect(howBigToDrawIt('safe', { width: 0, height: 0 }, ROOM)).toBe(1);
  });
});
