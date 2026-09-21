import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollingPages } from './ScrollingPages';

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 800 });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 600 });
});

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetHeight');
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetWidth');
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
  it('lays the pages of the chapter down one strip, in order', () => {
    draw();

    expect(screen.getAllByRole('img').map((page) => page.getAttribute('alt'))).toEqual([
      'Page 1',
      'Page 2',
      'Page 3',
    ]);
  });

  it('holds only the pages near the screen of a long chapter', () => {
    draw({ pageCount: 400 });

    expect(screen.getAllByRole('img').length).toBeLessThan(20);
    expect(screen.queryByRole('img', { name: 'Page 300' })).not.toBeInTheDocument();
  });

  it('reports the page across the middle of the screen', () => {
    const { onPageChange } = draw();

    expect(onPageChange).toHaveBeenCalledWith(0);
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
