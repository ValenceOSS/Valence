import { describe, expect, it } from 'vitest';
import { pictureBox } from './pictureBox';

describe('where the picture sits in the player', () => {
  it('centres the picture at its own shape, as large as the player allows', () => {
    expect(pictureBox(2)).toEqual({
      left: '50%',
      top: '50%',
      width: 'min(100cqw, calc(100cqh * 2))',
      height: 'min(100cqh, calc(100cqw / 2))',
      transform: 'translate(-50%, -50%)',
    });
  });

  it('takes the whole player while the picture’s shape is not known', () => {
    expect(pictureBox(null)).toEqual({ inset: 0 });
  });
});
