import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTrackpadPages } from './useTrackpadPages';

const INSTANT = { duration: 0 };

/**
 * A strip of three 800-pixel pages, described since jsdom lays nothing out, whose scroll position
 * can be read back.
 */
const stripOf = () => {
  const element = document.createElement('div');
  let left = 0;

  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 800 });
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: 2400 });
  Object.defineProperty(element, 'scrollLeft', {
    configurable: true,
    get: () => left,
    set: (value: number) => {
      left = Math.min(Math.max(value, 0), 1600);
    },
  });
  document.body.append(element);

  return element;
};

/**
 * Sends wheel events one after another, a few milliseconds apart as a trackpad does.
 */
const swipe = (element: HTMLElement, deltas: readonly number[]) => {
  for (const deltaX of deltas) {
    act(() => {
      element.dispatchEvent(new WheelEvent('wheel', { deltaX, deltaY: 0, cancelable: true }));
      vi.advanceTimersByTime(8);
    });
  }
};

const settle = () => {
  act(() => {
    vi.advanceTimersByTime(1000);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('useTrackpadPages', () => {
  it('follows the fingers while they are down', () => {
    const strip = stripOf();

    renderHook(() => {
      useTrackpadPages({ current: strip }, true, INSTANT);
    });
    swipe(strip, [20, 30]);

    expect(strip.scrollLeft).toBe(50);
  });

  it('lands on the next page once a swipe goes far enough, and no further however hard', () => {
    const strip = stripOf();

    renderHook(() => {
      useTrackpadPages({ current: strip }, true, INSTANT);
    });
    swipe(strip, [200, 400, 600, 400, 200, 100]);
    settle();

    expect(strip.scrollLeft).toBe(800);
  });

  it('goes back to the page it was on after a swipe too small to mean anything', () => {
    const strip = stripOf();

    renderHook(() => {
      useTrackpadPages({ current: strip }, true, INSTANT);
    });
    swipe(strip, [10, 8, 6]);
    settle();

    expect(strip.scrollLeft).toBe(0);
  });

  it('lets go as soon as the swipe coasts, and turns nothing further with the rest of it', () => {
    const strip = stripOf();

    renderHook(() => {
      useTrackpadPages({ current: strip }, true, INSTANT);
    });
    swipe(strip, [20, 30, 40, 30, 20, 12]);
    settle();

    expect(strip.scrollLeft).toBe(800);

    swipe(strip, [8, 5, 3, 2, 1]);
    settle();

    expect(strip.scrollLeft).toBe(800);
  });

  it('follows a swipe straight back while the last one is still coasting', () => {
    const strip = stripOf();

    renderHook(() => {
      useTrackpadPages({ current: strip }, true, INSTANT);
    });
    swipe(strip, [20, 30, 40, 30, 20, 12, 8, 5]);
    swipe(strip, [-20, -30, -40, -30, -20, -12]);
    settle();

    expect(strip.scrollLeft).toBe(0);
  });

  it('leaves an up-and-down scroll to the page', () => {
    const strip = stripOf();

    renderHook(() => {
      useTrackpadPages({ current: strip }, true, INSTANT);
    });

    const scroll = new WheelEvent('wheel', { deltaX: 2, deltaY: 40, cancelable: true });

    strip.dispatchEvent(scroll);

    expect(scroll.defaultPrevented).toBe(false);
  });

  it('does nothing where there is only the one page', () => {
    const strip = stripOf();

    renderHook(() => {
      useTrackpadPages({ current: strip }, false, INSTANT);
    });
    swipe(strip, [200, 400]);

    expect(strip.scrollLeft).toBe(0);
  });
});
