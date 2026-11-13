import { describe, expect, it } from 'vitest';
import { PICTURE_LIMITS } from './PICTURE_LIMITS';

describe('PICTURE_LIMITS', () => {
  it('lets artwork and the picture behind the way in be larger than a face, and a logo smaller', () => {
    expect(PICTURE_LIMITS.artwork.mostBytes).toBeGreaterThan(PICTURE_LIMITS.face.mostBytes);
    expect(PICTURE_LIMITS.splashscreen.mostPixelsAnEdge).toBeGreaterThan(
      PICTURE_LIMITS.face.mostPixelsAnEdge,
    );
    expect(PICTURE_LIMITS.brandLogo.mostBytes).toBeLessThan(PICTURE_LIMITS.face.mostBytes);
  });
});
