import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Stepper } from './Stepper';
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

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'account', label: 'Your account', detail: 'Who runs this server' },
  { id: 'done', label: 'Finish' },
];

afterEach(() => {
  reducedMotion.current = false;
});

describe('Stepper', () => {
  it('is a navigation landmark named for the flow', () => {
    render(<Stepper label="Setting up" steps={STEPS} current="account" />);

    expect(screen.getByRole('navigation', { name: 'Setting up' })).toBeInTheDocument();
  });

  it('lists every step in order, with the detail of one that has it', () => {
    render(<Stepper label="Setting up" steps={STEPS} current="account" />);

    const items = within(screen.getByRole('list')).getAllByRole('listitem');

    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Welcome');
    expect(items[1]).toHaveTextContent('Your account');
    expect(items[1]).toHaveTextContent('Who runs this server');
    expect(items[2]).toHaveTextContent('Finish');
  });

  it('marks the step being shown as the current one, and only that one', () => {
    render(<Stepper label="Setting up" steps={STEPS} current="account" />);

    const items = within(screen.getByRole('list')).getAllByRole('listitem');

    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(items[2]).not.toHaveAttribute('aria-current');
  });

  it('ticks the steps already left and numbers the rest', () => {
    render(<Stepper label="Setting up" steps={STEPS} current="account" />);

    const items = within(screen.getByRole('list')).getAllByRole('listitem');

    expect(
      within(items[0] ?? document.body).getByRole('img', { name: 'Done' }),
    ).toBeInTheDocument();
    expect(within(items[1] ?? document.body).queryByRole('img', { name: 'Done' })).toBeNull();
    expect(items[1]).toHaveTextContent('2');
    expect(items[2]).toHaveTextContent('3');
  });

  it('says how far through the flow it is, for the folded shape', () => {
    render(<Stepper label="Setting up" steps={STEPS} current="done" shape="bar" />);

    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    expect(screen.getAllByText('Finish').length).toBeGreaterThan(0);
  });

  it('starts at the first step when the current one is not among them', () => {
    render(<Stepper label="Setting up" steps={STEPS} current="elsewhere" />);

    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    expect(within(screen.getByRole('list')).getAllByRole('listitem')[0]).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  it('hides the folded bar when told to list the steps', () => {
    render(<Stepper label="Setting up" steps={STEPS} current="account" shape="list" />);

    expect(screen.getByRole('list')).toHaveClass('flex');
    expect(screen.getByText('Step 2 of 3').closest('.flex-col')).toHaveClass('hidden');
  });

  it('hides the list when told to fold into a bar', () => {
    render(<Stepper label="Setting up" steps={STEPS} current="account" shape="bar" />);

    expect(screen.getByRole('list', { hidden: true })).toHaveClass('hidden');
    expect(screen.getByText('Step 2 of 3').closest('.flex-col')).toHaveClass('flex');
  });

  it('lists the steps only where there is room by default', () => {
    render(<Stepper label="Setting up" steps={STEPS} current="account" className="w-64" />);

    expect(screen.getByRole('list')).toHaveClass('lg:flex');
    expect(screen.getByRole('navigation')).toHaveClass('w-64');
  });

  it('still shows every step when motion is reduced', () => {
    reducedMotion.current = true;

    render(<Stepper label="Setting up" steps={STEPS} current="done" />);

    expect(within(screen.getByRole('list')).getAllByRole('img', { name: 'Done' })).toHaveLength(2);
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
  });
});
