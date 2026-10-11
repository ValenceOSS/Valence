import { describe, expect, it } from 'vitest';
import { unescapeNal } from '@ValenceScreens/playback/engine/hevc/unescapeNal';

describe('unescapeNal', () => {
  it('drops the 03 an encoder put after two zero bytes', () => {
    expect([...unescapeNal(Uint8Array.from([0, 0, 3, 1, 5, 0, 0, 3, 0]))]).toEqual([
      0, 0, 1, 5, 0, 0, 0,
    ]);
  });

  it('keeps a 03 that does not follow two zero bytes', () => {
    expect([...unescapeNal(Uint8Array.from([0, 3, 3]))]).toEqual([0, 3, 3]);
  });
});
