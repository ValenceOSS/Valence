import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { motionValue } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import { HeroSteps } from './HeroSteps';

const STEPS = [
  { id: 'one', title: 'First thing.', detail: 'About the first thing.' },
  { id: 'two', title: 'Second thing.', detail: 'About the second thing.' },
] as const;

describe('HeroSteps', () => {
  it('names each step by its title and what it says', () => {
    render(
      <HeroSteps
        steps={STEPS}
        active={0}
        progress={motionValue(0)}
        isStill={false}
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: /^First thing\.\s*About the first thing\.$/u }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Second thing\.\s*About the second thing\.$/u }),
    ).toBeInTheDocument();
  });

  it('marks the step that is showing, and only that one', () => {
    render(
      <HeroSteps
        steps={STEPS}
        active={1}
        progress={motionValue(0)}
        isStill={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { pressed: true })).toHaveAccessibleName(/Second thing\./u);
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
  });

  it('puts a step on screen when it is pressed', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <HeroSteps
        steps={STEPS}
        active={0}
        progress={motionValue(0)}
        isStill={false}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Second thing\./u }));

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HeroSteps.displayName).toBe('HeroSteps');
  });
});
