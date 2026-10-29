import { fittedTo, pictureIn } from './fittedTo';

const SCREEN = { width: 956, height: 440 };

const LETTERBOXED = { x: 0, y: 0.1278, width: 1, height: 0.7444 };

describe('fittedTo', () => {
  it('runs a wide film across the whole width', () => {
    const box = fittedTo(SCREEN, { width: 3840, height: 1606 }, null);

    expect(box?.width).toBe(956);
    expect(box?.height).toBeCloseTo(399.83, 2);
    expect(box?.left).toBe(0);
    expect(box?.top).toBeCloseTo(20.09, 2);
  });

  it('runs a narrow picture down the whole height', () => {
    const box = fittedTo(SCREEN, { width: 1440, height: 1080 }, null);

    expect(box?.height).toBe(440);
    expect(box?.width).toBeCloseTo(586.67, 2);
    expect(box?.left).toBeCloseTo(184.67, 2);
  });

  it('fits a letterboxed frame by its picture, letting its bars fall off the screen', () => {
    const box = fittedTo(SCREEN, { width: 3840, height: 2160 }, LETTERBOXED);

    expect(box?.width).toBe(956);
    expect(box?.height).toBeCloseTo(537.75, 2);
    expect(box?.top).toBeCloseTo(-48.87, 1);
  });

  it('knows nothing until the frame has been measured', () => {
    expect(fittedTo(SCREEN, null, LETTERBOXED)).toBeNull();
  });

  it('knows nothing until the screen has been measured', () => {
    expect(fittedTo({ width: 0, height: 0 }, { width: 1920, height: 1080 }, null)).toBeNull();
  });
});

describe('pictureIn', () => {
  it('is the frame where there are no bars', () => {
    expect(pictureIn({ width: 1920, height: 1080 }, null)).toStrictEqual({
      width: 1920,
      height: 1080,
    });
  });

  it('is the picture inside the bars where there are some', () => {
    const picture = pictureIn({ width: 3840, height: 2160 }, LETTERBOXED);

    expect(picture?.width).toBe(3840);
    expect(picture?.height).toBeCloseTo(1607.9, 1);
  });

  it('knows nothing until the frame has been measured', () => {
    expect(pictureIn(null, LETTERBOXED)).toBeNull();
  });
});
