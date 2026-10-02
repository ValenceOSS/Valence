import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WelcomeStep } from './WelcomeStep';

describe('WelcomeStep', () => {
  it('says what setting up is about to ask', () => {
    render(<WelcomeStep onBegin={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Set up Valence' })).toBeInTheDocument();
    expect(screen.getByText(/Nobody has an account on this server yet/)).toBeInTheDocument();
  });

  it('goes on to the account when asked', async () => {
    const onBegin = vi.fn();

    render(<WelcomeStep onBegin={onBegin} />);

    await userEvent.click(screen.getByRole('button', { name: 'Make your account' }));

    expect(onBegin).toHaveBeenCalledOnce();
  });

  it('offers no way back, being the first step', () => {
    render(<WelcomeStep onBegin={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });
});
