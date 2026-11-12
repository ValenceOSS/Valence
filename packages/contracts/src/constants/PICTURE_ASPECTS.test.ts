import { describe, expect, it } from 'vitest';
import { PICTURE_ASPECTS } from './PICTURE_ASPECTS';

describe('PICTURE_ASPECTS', () => {
  it('frames faces and covers square, posters tall and backdrops wide', () => {
    expect(PICTURE_ASPECTS.face).toBe(1);
    expect(PICTURE_ASPECTS.cover).toBe(1);
    expect(PICTURE_ASPECTS.poster).toBeLessThan(1);
    expect(PICTURE_ASPECTS.backdrop).toBeGreaterThan(1);
  });
});
