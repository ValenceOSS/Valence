import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReaderVignette } from './ReaderVignette';
import type * as MotionReact from 'motion/react';

const motion = vi.hoisted(() => ({ isReduced: false }));

vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof MotionReact>()),
  useReducedMotionConfig: () => motion.isReduced,
  useInView: () => false,
}));

describe('ReaderVignette', () => {
  it('shows a page of a book, with its chapter and page number', () => {
    render(<ReaderVignette />);

    expect(screen.getByText('The Salt Road')).toBeInTheDocument();
    expect(screen.getByText('212')).toBeInTheDocument();
  });

  it('shows how far through the book the reader is', () => {
    render(<ReaderVignette />);

    expect(screen.getByRole('progressbar', { name: 'Through the book' })).toBeInTheDocument();
    expect(screen.getByText('64%')).toBeInTheDocument();
  });

  it('is simply a page for somebody who asked for less motion', () => {
    motion.isReduced = true;
    render(<ReaderVignette />);

    expect(screen.getByText('212')).toBeInTheDocument();
    motion.isReduced = false;
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReaderVignette.displayName).toBe('ReaderVignette');
  });
});
