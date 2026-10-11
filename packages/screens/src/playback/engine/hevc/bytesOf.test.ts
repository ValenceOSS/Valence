import { describe, expect, it } from 'vitest';
import { bytesOf } from '@ValenceScreens/playback/engine/hevc/bytesOf';

describe('bytesOf', () => {
  it('reads two hexadecimal digits a byte', () => {
    expect([...bytesOf('00ff4201')]).toEqual([0, 255, 66, 1]);
  });
});
