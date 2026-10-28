import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StepTrailWords } from './StepTrailWords';
import type * as MotionModule from 'motion/react';

const { reducedMotion } = vi.hoisted(() => ({ reducedMotion: { current: true } }));

vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof MotionModule>('motion/react');

  return {
    ...actual,
    useReducedMotion: () => reducedMotion.current,
    useReducedMotionConfig: () => reducedMotion.current,
  };
});

afterEach(() => {
  reducedMotion.current = true;
});

describe('StepTrailWords', () => {
  it('says its words, with the classes given', () => {
    render(<StepTrailWords className="valence-shimmer-text">Downloading</StepTrailWords>);

    expect(screen.getByText('Downloading')).toHaveClass('valence-shimmer-text');
  });

  it('says the new words once they change', async () => {
    const { rerender } = render(<StepTrailWords>Searching</StepTrailWords>);

    rerender(<StepTrailWords>Downloading</StepTrailWords>);

    expect(await screen.findByText('Downloading')).toBeInTheDocument();
  });

  it('says its words with motion allowed', () => {
    reducedMotion.current = false;

    render(<StepTrailWords>Importing</StepTrailWords>);

    expect(screen.getByText('Importing')).toBeInTheDocument();
  });
});
