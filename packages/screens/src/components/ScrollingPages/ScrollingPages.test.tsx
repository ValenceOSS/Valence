import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollingPages } from './ScrollingPages';

type Callback = (entries: { target: Element; isIntersecting: boolean }[]) => void;

const watchers: { callback: Callback; observed: Element[] }[] = [];

class RecordingObserver {
  readonly watcher: { callback: Callback; observed: Element[] };

  constructor(callback: Callback) {
    this.watcher = { callback, observed: [] };
    watchers.push(this.watcher);
  }

  observe(target: Element): void {
    this.watcher.observed.push(target);
  }

  unobserve(): void {
    return undefined;
  }

  disconnect(): void {
    return undefined;
  }
}

beforeEach(() => {
  watchers.length = 0;
  vi.stubGlobal('IntersectionObserver', RecordingObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const draw = (overrides: Partial<Parameters<typeof ScrollingPages>[0]> = {}) => {
  const handlers = { onPageChange: vi.fn(), onNextChapter: vi.fn(), onTap: vi.fn() };

  render(
    <ScrollingPages
      bookId="a-book"
      chapterId="one"
      pageCount={3}
      startAtPage={0}
      hasNextChapter
      {...handlers}
      {...overrides}
    />,
  );

  return handlers;
};

describe('ScrollingPages', () => {
  it('lays every page of the chapter down one strip, in order', () => {
    draw();

    expect(screen.getAllByRole('img').map((page) => page.getAttribute('alt'))).toEqual([
      'Page 1',
      'Page 2',
      'Page 3',
    ]);
  });

  it('asks for pages as they come near rather than all at once', () => {
    draw();

    screen.getAllByRole('img').forEach((page) => {
      expect(page).toHaveAttribute('loading', 'lazy');
    });
  });

  it('reports the page that comes across the middle of the screen', () => {
    const { onPageChange } = draw();
    const second = screen.getByRole('img', { name: 'Page 2' });

    watchers[0]?.callback([{ target: second, isIntersecting: true }]);

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('does not report a page that has left the middle', () => {
    const { onPageChange } = draw();

    watchers[0]?.callback([
      { target: screen.getByRole('img', { name: 'Page 1' }), isIntersecting: false },
    ]);

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('carries on into the next chapter from the foot of the strip', async () => {
    const { onNextChapter } = draw();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Next chapter' }));

    expect(onNextChapter).toHaveBeenCalledOnce();
  });

  it('says it is the end where there is no next chapter', () => {
    draw({ hasNextChapter: false });

    expect(screen.getByText('The end')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next chapter' })).not.toBeInTheDocument();
  });

  it('brings the controls back when the strip is pressed', async () => {
    const { onTap } = draw();

    await userEvent.setup().click(screen.getByRole('img', { name: 'Page 1' }));

    expect(onTap).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ScrollingPages.displayName).toBe('ScrollingPages');
  });
});
