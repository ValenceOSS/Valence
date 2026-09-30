import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WatchedBar } from './WatchedBar';

const fill = (): HTMLElement | null => screen.getByRole('img').querySelector('span');

describe('WatchedBar', () => {
  it('says how far through it is', () => {
    render(<WatchedBar watched={0.4} />);

    expect(screen.getByRole('img', { name: '40% watched' })).toBeInTheDocument();
  });

  it('fills as far as has been watched', () => {
    render(<WatchedBar watched={0.25} />);

    expect(fill()).toHaveStyle({ width: '25%' });
  });

  it('never fills past the end or before the start', () => {
    const { rerender } = render(<WatchedBar watched={1.7} />);

    expect(fill()).toHaveStyle({ width: '100%' });

    rerender(<WatchedBar watched={-0.3} />);

    expect(fill()).toHaveStyle({ width: '0%' });
  });

  it('takes the caller’s layout alongside its own', () => {
    render(<WatchedBar watched={0.5} className="-mt-1" />);

    expect(screen.getByRole('img')).toHaveClass('-mt-1', 'rounded-full');
  });
});
