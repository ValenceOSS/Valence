import { describe, expect, it } from 'vitest';
import { scrollDeltaToReveal } from './scrollDeltaToReveal';

const BOX = { top: 100, bottom: 500 };

describe('scrollDeltaToReveal', () => {
  it('asks for no movement where the item is already in view', () => {
    expect(scrollDeltaToReveal(BOX, { top: 200, bottom: 240 }, 8)).toBe(0);
  });

  it('scrolls down by what hangs below the list, and the margin', () => {
    expect(scrollDeltaToReveal(BOX, { top: 480, bottom: 520 }, 8)).toBe(28);
  });

  it('scrolls up by what hangs above the list, and the margin', () => {
    expect(scrollDeltaToReveal(BOX, { top: 90, bottom: 130 }, 8)).toBe(-18);
  });

  it('does not chase a margin the item already has room for', () => {
    expect(scrollDeltaToReveal(BOX, { top: 120, bottom: 480 }, 8)).toBe(0);
  });

  it('brings an item that is wholly out of sight into view', () => {
    expect(scrollDeltaToReveal(BOX, { top: 800, bottom: 840 }, 0)).toBe(340);
  });
});
