import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StepTrailLines } from './StepTrailLines';
import type * as MotionModule from 'motion/react';

const { reducedMotion } = vi.hoisted(() => ({ reducedMotion: { current: false } }));

vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof MotionModule>('motion/react');

  return {
    ...actual,
    useReducedMotion: () => reducedMotion.current,
    useReducedMotionConfig: () => reducedMotion.current,
  };
});

const LINES = [
  { id: 'l1', mark: 'quiet', content: 'Asked three indexers' },
  { id: 'l2', mark: 'failed', content: 'One could not answer' },
  { id: 'l3', mark: 'current', content: 'Waiting on the rest' },
] as const;

afterEach(() => {
  reducedMotion.current = false;
});

describe('StepTrailLines', () => {
  it('lists every line in order', () => {
    render(<StepTrailLines lines={LINES} hasNext isSettled={false} />);

    const items = within(screen.getByRole('list')).getAllByRole('listitem');

    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Asked three indexers');
    expect(items[2]).toHaveTextContent('Waiting on the rest');
  });

  it('dots a failure red and the newest line lit', () => {
    render(<StepTrailLines lines={LINES} hasNext={false} isSettled />);

    const items = within(screen.getByRole('list')).getAllByRole('listitem');

    expect(items[1]?.querySelector('.bg-danger')).not.toBeNull();
    expect(items[2]?.querySelector('.bg-accent')).not.toBeNull();
  });

  it('bends back out to the next step only when there is one', () => {
    const { container, rerender } = render(
      <StepTrailLines lines={LINES} hasNext isSettled={false} />,
    );

    expect(container.querySelectorAll('.rounded-br-\\[7px\\]')).toHaveLength(1);

    rerender(<StepTrailLines lines={LINES} hasNext={false} isSettled={false} />);

    expect(container.querySelectorAll('.rounded-br-\\[7px\\]')).toHaveLength(0);
  });

  it('draws the same lines with motion reduced', () => {
    reducedMotion.current = true;

    render(<StepTrailLines lines={LINES} hasNext isSettled />);

    expect(screen.getByText('One could not answer')).toBeInTheDocument();
  });
});
