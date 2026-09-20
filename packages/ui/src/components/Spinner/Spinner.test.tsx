import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Spinner } from './Spinner';
import type * as MotionReact from 'motion/react';

const motion = vi.hoisted(() => ({ isReduced: false }));

vi.mock('motion/react', async () => ({
  ...(await vi.importActual<typeof MotionReact>('motion/react')),
  useReducedMotion: () => motion.isReduced,
  useReducedMotionConfig: () => motion.isReduced,
}));

afterEach(() => {
  motion.isReduced = false;
});

describe('Spinner', () => {
  it('exposes itself as a status region named by its label', () => {
    render(<Spinner label="Loading library" />);

    expect(screen.getByRole('status', { name: 'Loading library' })).toBeInTheDocument();
  });

  it('draws small enough to sit inside a badge', () => {
    render(<Spinner label="Downloading" size="xs" />);

    expect(
      screen.getByRole('status', { name: 'Downloading' }).querySelector('svg'),
    ).toHaveAttribute('width', '0.75rem');
  });

  it('accepts a custom class', () => {
    render(<Spinner label="Loading" className="text-danger" />);

    expect(screen.getByRole('status', { name: 'Loading' })).toHaveClass('text-danger');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Spinner.displayName).toBe('Spinner');
  });

  it('holds still for somebody who asked for less motion', () => {
    motion.isReduced = true;

    render(<Spinner label="Loading" />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });
});
