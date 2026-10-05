import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrollMarginIn } from './scrollMarginIn';

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Makes an element that reports a given top edge.
 *
 * @param top - Where its top edge is, in pixels from the top of the window.
 * @returns The element.
 */
const placedAt = (top: number): HTMLElement => {
  const element = document.createElement('div');

  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, top, 100, 100));

  return element;
};

describe('scrollMarginIn', () => {
  it('measures from the top of a panel, counting what it has scrolled', () => {
    const panel = placedAt(100);

    panel.scrollTop = 50;

    expect(scrollMarginIn(placedAt(300), panel)).toBe(250);
  });

  it('measures from the top of the page where the window scrolls', () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(40);

    expect(scrollMarginIn(placedAt(200), null)).toBe(240);
  });
});
