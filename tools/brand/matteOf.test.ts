import { describe, expect, it } from 'vitest';
import { matteOf } from './matteOf';

describe('matteOf', () => {
  it('keeps solid artwork, drops bare background, and halves what is half there', () => {
    const onBlack = Uint8Array.from([200, 100, 50, 0, 0, 0, 64, 64, 64]);
    const onWhite = Uint8Array.from([200, 100, 50, 255, 255, 255, 191, 191, 191]);

    expect([...matteOf(onBlack, onWhite)]).toEqual([
      200, 100, 50, 255, 0, 0, 0, 0, 128, 128, 128, 128,
    ]);
  });
});
