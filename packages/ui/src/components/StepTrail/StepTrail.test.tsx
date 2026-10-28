import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StepTrail } from './StepTrail';
import type { StepTrailStep } from './StepTrail.types';
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

const LINES = [
  { id: 'l1', mark: 'quiet', content: 'Asked three indexers' },
  { id: 'l2', mark: 'quiet', content: 'Chose the best of 12' },
] as const;

const STEPS: readonly StepTrailStep[] = [
  { id: 'search', label: 'Found a release', mark: 'done', lines: LINES },
  { id: 'download', label: 'Downloading', mark: 'current' },
  { id: 'import', label: 'Importing', mark: 'waiting' },
];

/**
 * As many steps as given, every one done.
 */
const manySteps = (count: number): StepTrailStep[] =>
  Array.from({ length: count }, (_, at) => ({
    id: `step-${at.toString()}`,
    label: `Step ${(at + 1).toString()}`,
    mark: 'done',
  }));

afterEach(() => {
  reducedMotion.current = true;
});

describe('StepTrail', () => {
  it('is a list named for what the trail is, a step to each item', () => {
    render(<StepTrail label="Fetching Dune" steps={STEPS} />);

    const list = screen.getByRole('list', { name: 'Fetching Dune' });

    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('marks the step under way as the current one, and only that one', () => {
    render(<StepTrail label="Fetching Dune" steps={STEPS} />);

    const items = within(screen.getByRole('list', { name: 'Fetching Dune' })).getAllByRole(
      'listitem',
    );

    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(items[2]).not.toHaveAttribute('aria-current');
  });

  it('keeps a done step folded until its row is pressed, and folds it again', () => {
    render(<StepTrail label="Fetching Dune" steps={STEPS} />);

    const row = screen.getByRole('button', { name: 'Found a release' });

    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Asked three indexers')).toBeNull();

    fireEvent.click(row);

    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Asked three indexers')).toBeInTheDocument();

    fireEvent.click(row);

    expect(row).toHaveAttribute('aria-expanded', 'false');
  });

  it('is no button for a step with nothing to unfold', () => {
    render(<StepTrail label="Fetching Dune" steps={STEPS} />);

    expect(screen.queryByRole('button', { name: 'Downloading' })).toBeNull();
  });

  it('shows the lines of a step open at first, and folds and opens them again', () => {
    render(
      <StepTrail
        label="Fetching Dune"
        steps={[
          { id: 'search', label: 'Searching', mark: 'current', lines: LINES, isOpenAtFirst: true },
        ]}
      />,
    );

    const row = screen.getByRole('button', { name: 'Searching' });

    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Chose the best of 12')).toBeInTheDocument();

    fireEvent.click(row);

    expect(row).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(row);

    expect(row).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows only the latest six steps until the earlier ones are asked for', () => {
    render(<StepTrail label="Fetching Dune" steps={manySteps(8)} />);

    expect(screen.queryByText('Step 1')).toBeNull();
    expect(screen.getByText('Step 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show 2 earlier steps' }));

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show 2 earlier steps' })).toBeNull();
  });

  it('asks for no earlier steps where all of them fit', () => {
    render(<StepTrail label="Fetching Dune" steps={manySteps(6)} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('says how long a step took, where it stands, or carries a pill', () => {
    render(
      <StepTrail
        label="Fetching Dune"
        steps={[
          { id: 'a', label: 'Found a release', mark: 'done', aside: { kind: 'note', text: '12s' } },
          {
            id: 'b',
            label: 'Downloading',
            mark: 'failed',
            aside: { kind: 'state', text: 'Stalled', tone: 'danger' },
          },
          {
            id: 'c',
            label: 'Importing',
            mark: 'locked',
            aside: { kind: 'badge', text: 'Needs approval', tone: 'warning' },
          },
        ]}
      />,
    );

    expect(screen.getByText('12s')).toBeInTheDocument();
    expect(screen.getByText('Stalled').closest('.text-danger')).not.toBeNull();
    expect(screen.getByText('Needs approval')).toBeInTheDocument();
  });

  it('draws the same trail with motion allowed', () => {
    reducedMotion.current = false;

    render(<StepTrail label="Fetching Dune" steps={STEPS} />);

    expect(screen.getByRole('list', { name: 'Fetching Dune' })).toBeInTheDocument();
  });
});
