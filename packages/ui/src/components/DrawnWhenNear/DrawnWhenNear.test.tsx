import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DrawnWhenNear } from './DrawnWhenNear';

type Seen = (
  entries: { isIntersecting: boolean; boundingClientRect: { height: number } }[],
) => void;

/**
 * Stands in for the browser's watch on what is near the screen, handing back how to say it moved.
 */
const watchingTheScreen = (): { tell: (isNear: boolean, height: number) => void } => {
  const seen: Seen[] = [];

  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(told: Seen) {
        seen.push(told);
      }

      observe() {
        return undefined;
      }

      disconnect() {
        return undefined;
      }
    },
  );

  return {
    tell: (isNear, height) => {
      act(() => {
        for (const told of seen) {
          told([{ isIntersecting: isNear, boundingClientRect: { height } }]);
        }
      });
    },
  };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DrawnWhenNear', () => {
  it('draws the block from the start', () => {
    watchingTheScreen();

    render(<DrawnWhenNear>{() => <p>A row</p>}</DrawnWhenNear>);

    expect(screen.getByText('A row')).toBeInTheDocument();
  });

  it('puts the block away once it is far off, keeping a space as tall as it was', () => {
    const { tell } = watchingTheScreen();
    const { container } = render(<DrawnWhenNear>{() => <p>A row</p>}</DrawnWhenNear>);

    tell(false, 240);

    expect(screen.queryByText('A row')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveStyle({ height: '240px' });
  });

  it('draws the block again once it comes near', () => {
    const { tell } = watchingTheScreen();
    const { container } = render(<DrawnWhenNear>{() => <p>A row</p>}</DrawnWhenNear>);

    tell(false, 240);
    tell(true, 240);

    expect(screen.getByText('A row')).toBeInTheDocument();
    expect(container.firstElementChild?.getAttribute('style') ?? '').not.toContain('height');
  });

  it('keeps the space it first held while it stays far off', () => {
    const { tell } = watchingTheScreen();
    const { container } = render(<DrawnWhenNear>{() => <p>A row</p>}</DrawnWhenNear>);

    tell(false, 240);
    tell(false, 0);

    expect(container.firstElementChild).toHaveStyle({ height: '240px' });
  });
});
