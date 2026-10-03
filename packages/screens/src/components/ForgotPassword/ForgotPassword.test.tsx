import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PasswordResetAsk } from '@ValenceContracts/schemas/PasswordResetRequest';
import { ForgotPassword } from './ForgotPassword';

const askForPasswordReset =
  vi.fn<(ask: PasswordResetAsk, redirectTo: string) => Promise<boolean>>();

vi.mock('@ValenceClient/session/askForPasswordReset', () => ({
  askForPasswordReset: (ask: PasswordResetAsk, redirectTo: string) =>
    askForPasswordReset(ask, redirectTo),
}));

beforeEach(() => {
  askForPasswordReset.mockReset().mockResolvedValue(true);
});

describe('ForgotPassword', () => {
  it('asks for a link by username, back to the reset page, and says where it goes', async () => {
    render(<ForgotPassword />);

    await userEvent.click(screen.getByRole('button', { name: 'Forgot your password?' }));
    await userEvent.type(screen.getByLabelText('Username or email'), ' ada ');
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(
      await screen.findByText(/a link to set a new password has been sent/),
    ).toBeInTheDocument();
    expect(askForPasswordReset).toHaveBeenCalledWith(
      { identifier: 'ada' },
      `${window.location.origin}/reset-password`,
    );
  });

  it('starts from the address already typed', async () => {
    render(<ForgotPassword initialIdentifier="ada@example.com" />);

    await userEvent.click(screen.getByRole('button', { name: 'Forgot your password?' }));

    expect(screen.getByLabelText('Username or email')).toHaveValue('ada@example.com');
  });

  it('says when the server could not be asked', async () => {
    askForPasswordReset.mockResolvedValue(false);
    render(<ForgotPassword initialIdentifier="ada" />);

    await userEvent.click(screen.getByRole('button', { name: 'Forgot your password?' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByText('Something went wrong. Try again.')).toBeInTheDocument();
  });
});
