import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpreadStage } from './SpreadStage';

const SPREADS = [[0, 1], [2, 3], [4, 5], [6]];

const props = {
  spreads: SPREADS,
  spreadAt: 0,
  bookId: 'a-book',
  chapterId: 'one',
  across: 2,
  fit: 'both',
  gap: 0,
  isRightToLeft: false,
  isAnimated: false,
  onLoaded: vi.fn(),
} as const;

const shown = (): string[] =>
  screen.getAllByRole('img').map((page) => page.getAttribute('alt') ?? '');

describe('SpreadStage', () => {
  it('draws the pages of a spread in reading order for a book read left to right', () => {
    render(<SpreadStage {...props} />);

    expect(shown()).toEqual(['Page 1', 'Page 2']);
  });

  it('draws them the other way round for a book read right to left', () => {
    render(<SpreadStage {...props} isRightToLeft />);

    expect(shown()).toEqual(['Page 2', 'Page 1']);
  });

  it('asks for each page at the width it is drawn', () => {
    render(<SpreadStage {...props} />);

    screen.getAllByRole('img').forEach((page) => {
      expect(page.getAttribute('src')).toContain('width=');
    });
  });

  it('is simply the spread asked for where turning is not animated', () => {
    const { rerender } = render(<SpreadStage {...props} />);

    rerender(<SpreadStage {...props} spreadAt={2} />);

    expect(shown()).toEqual(['Page 5', 'Page 6']);
  });

  it('turns the first leaf towards a spread several turns away, not cutting to the last', () => {
    const { rerender } = render(<SpreadStage {...props} isAnimated />);

    rerender(<SpreadStage {...props} isAnimated spreadAt={2} />);

    expect(screen.getByRole('img', { name: 'Page 3' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Page 5' })).not.toBeInTheDocument();
  });

  it('shows a spread at once when the turn is to a single page, rather than a leaf over nothing', () => {
    const { rerender } = render(<SpreadStage {...props} isAnimated spreadAt={2} />);

    rerender(<SpreadStage {...props} isAnimated spreadAt={3} />);

    expect(screen.getByRole('img', { name: 'Page 7' })).toBeInTheDocument();
  });

  it('tells the reader when a page has loaded', () => {
    const onLoaded = vi.fn();

    render(<SpreadStage {...props} onLoaded={onLoaded} />);

    screen.getAllByRole('img').forEach((page) => {
      page.dispatchEvent(new Event('load'));
    });

    expect(onLoaded).toHaveBeenCalledTimes(2);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SpreadStage.displayName).toBe('SpreadStage');
  });
});
