import { describe, expect, it } from 'vitest';
import { CAPTION_COLOURS } from './CAPTION_COLOURS';

describe('CAPTION_COLOURS', () => {
  it('offers the broadcast caption colours, white first, each named', () => {
    expect(CAPTION_COLOURS.map((colour) => colour.id)).toEqual([
      '#ffffff',
      '#ffff00',
      '#00ff00',
      '#00ffff',
      '#ff0000',
      '#000000',
    ]);
    expect(CAPTION_COLOURS.every((colour) => colour.label.length > 0)).toBe(true);
  });
});
