import { describe, expect, it } from 'vitest';
import { cardArtworkOf } from './cardArtworkOf';

const media = { id: 'a', hasBackdrop: true, hasPoster: true };

describe('cardArtworkOf', () => {
  it('rests a wide card on its wide picture', () => {
    const { wide, resting } = cardArtworkOf(media, {
      shape: 'wide',
      isSeries: false,
      drawsLarge: false,
    });

    expect(resting).toBe(wide);
    expect(wide).toContain('/image/backdrop');
  });

  it('rests an upright card on its poster, at the middle size when it is drawn large', () => {
    expect(
      cardArtworkOf(media, { shape: 'poster', isSeries: false, drawsLarge: true }).resting,
    ).toContain('/image/poster?size=medium');
    expect(
      cardArtworkOf(media, { shape: 'poster', isSeries: false, drawsLarge: false }).resting,
    ).toContain('size=small');
  });

  it('has no picture for a title without artwork', () => {
    expect(
      cardArtworkOf(
        { id: 'b', hasBackdrop: false, hasPoster: false },
        { shape: 'poster', isSeries: false, drawsLarge: true },
      ),
    ).toEqual({ wide: undefined, resting: undefined });
  });
});
