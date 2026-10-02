import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { StepperDemo } from './StepperDemo';

describe('StepperDemo', () => {
  it('moves on a step and back again', async () => {
    render(<StepperDemo />);

    expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StepperDemo.displayName).toBe('StepperDemo');
  });
});
