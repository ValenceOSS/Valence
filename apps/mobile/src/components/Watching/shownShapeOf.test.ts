import { shownShapeOf } from './shownShapeOf';

const FILM = { width: 3840, height: 2160 };

describe('shownShapeOf', () => {
  it('takes the size of the picture the player was sent, where its pixels are square', () => {
    expect(shownShapeOf(FILM, { width: 2346, height: 1320 })).toStrictEqual({
      width: 2346,
      height: 1320,
    });
  });

  it('takes the library’s size before the player has said', () => {
    expect(shownShapeOf(FILM, null)).toStrictEqual(FILM);
  });

  it('stretches an anamorphic picture by the shape of its pixels', () => {
    expect(
      shownShapeOf(
        { width: 720, height: 480, videoPixelAspect: '32/27' },
        { width: 720, height: 480 },
      ),
    ).toMatchObject({ height: 480 });
    expect(
      shownShapeOf({ width: 720, height: 480, videoPixelAspect: '32/27' }, null)?.width,
    ).toBeCloseTo(853.33, 2);
  });

  it('reads the shape of its pixels written with a colon', () => {
    expect(
      shownShapeOf({ width: 720, height: 576, videoPixelAspect: '16:15' }, null),
    ).toStrictEqual({ width: 768, height: 576 });
  });

  it('stands a picture meant to be held upright on its end', () => {
    expect(
      shownShapeOf(
        { width: 1920, height: 1080, videoRotationDegrees: -90 },
        { width: 1920, height: 1080 },
      ),
    ).toStrictEqual({ width: 1080, height: 1920 });
  });

  it('takes the player’s size where the library has not been read', () => {
    expect(shownShapeOf(null, { width: 1280, height: 720 })).toStrictEqual({
      width: 1280,
      height: 720,
    });
  });

  it('ignores a pixel shape it cannot read', () => {
    expect(shownShapeOf({ ...FILM, videoPixelAspect: 'square' }, null)).toStrictEqual(FILM);
  });
});
