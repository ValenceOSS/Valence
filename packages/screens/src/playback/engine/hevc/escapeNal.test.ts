import { describe, expect, it } from 'vitest';
import { escapeNal } from '@ValenceScreens/playback/engine/hevc/escapeNal';
import { unescapeNal } from '@ValenceScreens/playback/engine/hevc/unescapeNal';

describe('escapeNal', () => {
  it('puts a 03 after two zero bytes followed by anything that could start a code', () => {
    expect([...escapeNal(Uint8Array.from([0, 0, 2, 0, 0, 0, 4]))]).toEqual([
      0, 0, 3, 2, 0, 0, 3, 0, 4,
    ]);
  });

  it('is undone by unescaping', () => {
    const raw = Uint8Array.from([7, 0, 0, 1, 0, 0, 3, 9]);

    expect([...unescapeNal(escapeNal(raw))]).toEqual([...raw]);
  });
});
