import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ScrollingText } from './ScrollingText';

class NothingComesIntoView implements IntersectionObserver {
  public readonly root = null;

  public readonly rootMargin = '';

  public readonly scrollMargin = '';

  public readonly thresholds = [];

  public observe(): void {
    return undefined;
  }

  public unobserve(): void {
    return undefined;
  }

  public disconnect(): void {
    return undefined;
  }

  public takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

/**
 * Opens one part of a book as a page to scroll, watching where it says somebody is.
 */
const open = () => {
  const onPlace = vi.fn();

  renderInAnAddress(
    <ScrollingText
      bookId="a-book"
      chapterId="a-chapter"
      startPart={0}
      landing={{ kind: 'start' }}
      lastPart={0}
      pageClassName=""
      textStyle={{}}
      inset={24}
      onPlace={onPlace}
      onFollow={vi.fn()}
      onScroller={vi.fn()}
    />,
  );

  return onPlace;
};

beforeEach(() => {
  installATestClient();
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response('<p>It is a truth universally acknowledged.</p>'))),
  );
  vi.stubGlobal('IntersectionObserver', NothingComesIntoView);
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', { configurable: true, value: 0 });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 400 });
});

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetTop');
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetHeight');
  Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('ScrollingText', () => {
  it('says how far into the part the reading line and the foot of the screen are', async () => {
    const onPlace = open();

    await screen.findByText('It is a truth universally acknowledged.');

    const scroller = document.querySelector<HTMLElement>('[data-reading-scroller]');

    if (scroller === null) {
      throw new Error('The page to scroll was not drawn.');
    }

    await waitFor(() => {
      expect(scroller).toHaveClass('opacity-100');
    });
    Object.defineProperty(scroller, 'scrollTop', { configurable: true, value: 100 });
    fireEvent.scroll(scroller);

    await waitFor(() => {
      expect(onPlace).toHaveBeenLastCalledWith(0, 0.2, 0.5);
    });
  });

  it('holds the foot of the screen to the end of the part', async () => {
    const onPlace = open();

    await screen.findByText('It is a truth universally acknowledged.');

    const scroller = document.querySelector<HTMLElement>('[data-reading-scroller]');

    if (scroller === null) {
      throw new Error('The page to scroll was not drawn.');
    }

    await waitFor(() => {
      expect(scroller).toHaveClass('opacity-100');
    });
    Object.defineProperty(scroller, 'scrollTop', { configurable: true, value: 800 });
    fireEvent.scroll(scroller);

    await waitFor(() => {
      expect(onPlace).toHaveBeenLastCalledWith(0, 0.9, 1);
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ScrollingText.displayName).toBe('ScrollingText');
  });
});
