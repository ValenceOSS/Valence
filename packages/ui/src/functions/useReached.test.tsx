import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useReached } from './useReached';

const inView = vi.hoisted(() => ({ isInView: false }));

vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useInView: () => inView.isInView,
}));

/**
 * Says whether the hook counts its element as reached.
 */
const Watched = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isReached = useReached(ref);

  return <div ref={ref}>{isReached ? 'reached' : 'not reached'}</div>;
};

const placeAt = (top: number): void => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    DOMRect.fromRect({ x: 0, y: top, width: 100, height: 100 }),
  );
};

beforeEach(() => {
  inView.isInView = false;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useReached', () => {
  it('is not reached before it has been seen', () => {
    placeAt(5000);
    render(<Watched />);

    expect(screen.getByText('not reached')).toBeInTheDocument();
  });

  it('is reached once it comes into view', () => {
    inView.isInView = true;
    render(<Watched />);

    expect(screen.getByText('reached')).toBeInTheDocument();
  });

  it('stays reached once the page has scrolled on past it', () => {
    inView.isInView = true;
    const { rerender } = render(<Watched />);

    inView.isInView = false;
    placeAt(-400);
    rerender(<Watched />);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(screen.getByText('reached')).toBeInTheDocument();
  });

  it('is put back once the page is scrolled up past it again', () => {
    inView.isInView = true;
    const { rerender } = render(<Watched />);

    inView.isInView = false;
    placeAt(-400);
    rerender(<Watched />);

    placeAt(window.innerHeight + 200);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(screen.getByText('not reached')).toBeInTheDocument();
  });
});
