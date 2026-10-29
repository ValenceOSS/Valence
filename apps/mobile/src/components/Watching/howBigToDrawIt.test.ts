import { howBigToDrawIt } from './howBigToDrawIt';

const SCREEN = { width: 956, height: 440 };

const WIDE = { width: 3840, height: 1606 };

describe('howBigToDrawIt', () => {
  it('fits the whole picture to the screen, edge to edge', () => {
    expect(howBigToDrawIt('fit', SCREEN, WIDE)).toBe(1);
  });

  it('zooms a picture wider than the screen until it fills the height', () => {
    expect(howBigToDrawIt('fill', SCREEN, WIDE)).toBeCloseTo(1.1005, 4);
  });

  it('zooms a picture taller than the screen until it fills the width', () => {
    expect(howBigToDrawIt('fill', SCREEN, { width: 1440, height: 1080 })).toBeCloseTo(1.6295, 4);
  });

  it('leaves a picture the shape of the screen as it is', () => {
    expect(howBigToDrawIt('fill', SCREEN, { width: 1912, height: 880 })).toBeCloseTo(1, 6);
  });

  it('draws it at its own size before the player has said how big it is', () => {
    expect(howBigToDrawIt('fill', SCREEN, null)).toBe(1);
  });

  it('draws it at its own size before the screen has been measured', () => {
    expect(howBigToDrawIt('fill', { width: 0, height: 0 }, WIDE)).toBe(1);
  });
});
