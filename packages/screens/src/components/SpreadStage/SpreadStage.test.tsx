import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpreadStage } from './SpreadStage';

const draw = (overrides: Partial<Parameters<typeof SpreadStage>[0]> = {}) =>
  render(
    <SpreadStage
      pages={[0, 1]}
      spreadAt={0}
      bookId="a-book"
      chapterId="one"
      across={2}
      fit="both"
      gap={0}
      isRightToLeft={false}
      isAnimated={false}
      onLoaded={vi.fn()}
      {...overrides}
    />,
  );

const shown = (): string[] =>
  screen.getAllByRole('img').map((page) => page.getAttribute('alt') ?? '');

describe('SpreadStage', () => {
  it('draws the pages of a spread in reading order for a book read left to right', () => {
    draw();

    expect(shown()).toEqual(['Page 1', 'Page 2']);
  });

  it('draws them the other way round for a book read right to left', () => {
    draw({ isRightToLeft: true });

    expect(shown()).toEqual(['Page 2', 'Page 1']);
  });

  it('asks for each page at the width it is drawn', () => {
    draw();

    screen.getAllByRole('img').forEach((page) => {
      expect(page.getAttribute('src')).toContain('width=');
    });
  });

  it('is simply the next spread where turning is not animated', () => {
    const { rerender } = draw();

    rerender(
      <SpreadStage
        pages={[2, 3]}
        spreadAt={1}
        bookId="a-book"
        chapterId="one"
        across={2}
        fit="both"
        gap={0}
        isRightToLeft={false}
        isAnimated={false}
        onLoaded={vi.fn()}
      />,
    );

    expect(shown()).toEqual(['Page 3', 'Page 4']);
  });

  it('shows the next spread at once when a turn is on a single page, rather than a leaf over nothing', () => {
    const { rerender } = draw({ pages: [0], isAnimated: true });

    rerender(
      <SpreadStage
        pages={[1, 2]}
        spreadAt={1}
        bookId="a-book"
        chapterId="one"
        across={2}
        fit="both"
        gap={0}
        isRightToLeft={false}
        isAnimated
        onLoaded={vi.fn()}
      />,
    );

    expect(screen.getByRole('img', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Page 3' })).toBeInTheDocument();
  });

  it('tells the reader when a page has loaded', () => {
    const onLoaded = vi.fn();

    draw({ onLoaded });

    screen.getAllByRole('img').forEach((page) => {
      page.dispatchEvent(new Event('load'));
    });

    expect(onLoaded).toHaveBeenCalledTimes(2);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SpreadStage.displayName).toBe('SpreadStage');
  });
});
