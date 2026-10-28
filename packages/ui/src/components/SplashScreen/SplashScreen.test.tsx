import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SplashScreen } from './SplashScreen';
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

describe('SplashScreen', () => {
  it('says something is happening, for anyone who cannot see the bar', () => {
    render(<SplashScreen />);

    expect(screen.getByRole('status', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true');
  });

  it('shows the name of the instance', () => {
    render(<SplashScreen name="Living Room" />);

    expect(screen.getByText('Living Room')).toBeInTheDocument();
  });

  it('says what is being waited for when it is worth naming', () => {
    render(<SplashScreen label="Preparing your library" />);

    expect(screen.getByRole('status', { name: 'Preparing your library' })).toBeInTheDocument();
  });

  it('leaves the mark out where a bar already shows one, so it is not drawn twice', () => {
    render(<SplashScreen label="Loading your library" hasMark={false} />);

    expect(screen.getByRole('status', { name: 'Loading your library' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Valence')).not.toBeInTheDocument();
  });

  it('keeps its ground once the mark has been handed on, and only then lets it go', () => {
    const { rerender } = render(<SplashScreen label="Loading" />);

    expect(screen.getByRole('status', { name: 'Loading' })).not.toHaveClass('pointer-events-none');

    rerender(<SplashScreen label="Loading" hasMark={false} isLeaving />);

    const ground = screen.getByRole('status', { name: 'Loading' });

    expect(ground).toBeInTheDocument();
    expect(ground).toHaveClass('pointer-events-none');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SplashScreen.displayName).toBe('SplashScreen');
  });

  it('shows a still bar rather than a travelling one when less motion was asked for', () => {
    motion.isReduced = true;

    render(<SplashScreen name="Valence" label="Loading" />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('keeps a long name on one line inside the screen, a size smaller', () => {
    render(<SplashScreen name="The Morgan Family Home Cinema" />);

    const name = screen.getByText('The Morgan Family Home Cinema');

    expect(name).toHaveClass('truncate', 'max-w-[calc(100vw-7.5rem)]', 'text-4xl');
  });

  it('draws a short name at the wordmark’s own size', () => {
    render(<SplashScreen name="Valence" />);

    expect(screen.getByText('Valence')).toHaveClass('text-6xl');
  });

  it('holds up the mark it is given in place of Valence’s', () => {
    render(<SplashScreen name="Home Cinema" mark={<span>their mark</span>} />);

    expect(screen.getByText('their mark')).toBeInTheDocument();
  });
});
