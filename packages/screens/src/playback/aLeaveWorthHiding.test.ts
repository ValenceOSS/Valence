import { describe, expect, it } from 'vitest';
import { aLeaveWorthHiding } from './aLeaveWorthHiding';

const window = { left: 0, top: 0, right: 1920, bottom: 1080 };

const outside = { x: -4, y: 500 };

describe('a pointer leaving the picture', () => {
  it('means the viewer has gone when it is a mouse', () => {
    expect(aLeaveWorthHiding('mouse', outside, window)).toBe(true);
  });

  it('means only that a finger lifted, which happens after every tap', () => {
    expect(aLeaveWorthHiding('touch', outside, window)).toBe(false);
  });

  it('means nothing for a pen either, which is put down the same way', () => {
    expect(aLeaveWorthHiding('pen', outside, window)).toBe(false);
  });

  it('says nothing where a browser reports no kind at all', () => {
    expect(aLeaveWorthHiding('', outside, window)).toBe(false);
  });

  it('means nothing where the mouse is still over the picture, as Windows reports under the bar the window is dragged by', () => {
    expect(aLeaveWorthHiding('mouse', { x: 960, y: 16 }, window)).toBe(false);
  });

  it('means nothing where the mouse has not moved at all, as Windows reports when its controls are recoloured', () => {
    expect(aLeaveWorthHiding('mouse', { x: 960, y: 540 }, window)).toBe(false);
  });

  it('means the viewer has gone where the mouse left on the very edge', () => {
    expect(aLeaveWorthHiding('mouse', { x: 0, y: 540 }, window)).toBe(true);
    expect(aLeaveWorthHiding('mouse', { x: 960, y: 1080 }, window)).toBe(true);
  });

  it('measures against the picture wherever it sits on the page', () => {
    const inline = { left: 200, top: 100, right: 1000, bottom: 550 };

    expect(aLeaveWorthHiding('mouse', { x: 100, y: 300 }, inline)).toBe(true);
    expect(aLeaveWorthHiding('mouse', { x: 600, y: 300 }, inline)).toBe(false);
  });
});
