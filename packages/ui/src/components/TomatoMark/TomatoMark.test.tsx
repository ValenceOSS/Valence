import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TomatoMark } from './TomatoMark';

describe('TomatoMark', () => {
  it('shows a tomato for a score of 60% or more', () => {
    render(<TomatoMark score={60} />);

    expect(screen.getByRole('img', { name: 'Fresh on Rotten Tomatoes' })).toHaveAttribute(
      'src',
      expect.stringContaining('rotten-tomatoes-fresh'),
    );
  });

  it('shows a splat below it', () => {
    render(<TomatoMark score={59} />);

    expect(screen.getByRole('img', { name: 'Rotten on Rotten Tomatoes' })).toHaveAttribute(
      'src',
      expect.stringContaining('rotten-tomatoes-rotten'),
    );
  });

  it('takes the caller’s own classes', () => {
    render(<TomatoMark score={92} className="size-5" />);

    expect(screen.getByRole('img')).toHaveClass('size-5');
  });
});
