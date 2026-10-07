import { fittedTo } from '@ValenceTv/platform/fittedTo';

describe('fittedTo', () => {
  it('draws on a screen 1920 points across, scaled to the window', () => {
    expect(fittedTo(1920, 1080)).toEqual({ width: 1920, height: 1080, scale: 1 });
    expect(fittedTo(1280, 720)).toEqual({ width: 1920, height: 1080, scale: 2 / 3 });
    expect(fittedTo(3840, 2160)).toEqual({ width: 1920, height: 1080, scale: 2 });
  });

  it('keeps the window’s own shape', () => {
    expect(fittedTo(960, 600)).toEqual({ width: 1920, height: 1200, scale: 0.5 });
  });

  it('draws unscaled before the window has a size', () => {
    expect(fittedTo(0, 0)).toEqual({ width: 1920, height: 0, scale: 1 });
  });
});
