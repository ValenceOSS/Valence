import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WelcomeStep } from './WelcomeStep';

/**
 * The welcome, with the setup code typed so far.
 *
 * @param setupCode - The code.
 * @param problem - Why it was refused, where it was.
 * @returns What it was told.
 */
const welcome = (setupCode = '', problem: string | null = null) => {
  const onBegin = vi.fn();
  const onSetupCodeChange = vi.fn();

  render(
    <WelcomeStep
      setupCode={setupCode}
      onSetupCodeChange={onSetupCodeChange}
      problem={problem}
      onBegin={onBegin}
    />,
  );

  return { onBegin, onSetupCodeChange };
};

describe('WelcomeStep', () => {
  it('says what setting up is about to ask', () => {
    welcome();

    expect(screen.getByRole('heading', { name: 'Set up Valence' })).toBeInTheDocument();
    expect(screen.getByText(/No one has an account on this server yet/)).toBeInTheDocument();
  });

  it('asks for the code the server printed in its log, and says where to find it', async () => {
    const { onSetupCodeChange } = welcome();

    await userEvent.type(screen.getByLabelText('Setup code'), 'K');

    expect(onSetupCodeChange).toHaveBeenCalledWith('K');
    expect(screen.getByText(/printed it in its log/)).toBeInTheDocument();
  });

  it('goes on to the account only once a code is typed', () => {
    const { onBegin } = welcome();

    expect(screen.getByRole('button', { name: 'Create your account' })).toBeDisabled();
    expect(onBegin).not.toHaveBeenCalled();
  });

  it('goes on to the account when asked, with a code typed', async () => {
    const { onBegin } = welcome('K7QD-3MXP-9RTA-WZ4H');

    await userEvent.click(screen.getByRole('button', { name: 'Create your account' }));

    expect(onBegin).toHaveBeenCalledOnce();
  });

  it('says why a code was refused, under it', () => {
    welcome('WRONG', 'That setup code doesn’t match the one in the server’s log.');

    expect(
      screen.getByText('That setup code doesn’t match the one in the server’s log.'),
    ).toBeInTheDocument();
  });

  it('offers no way back, being the first step', () => {
    welcome();

    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });
});
