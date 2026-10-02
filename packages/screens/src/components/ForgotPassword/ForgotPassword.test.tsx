import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForgotPassword } from './ForgotPassword';

const askForPasswordReset = vi.fn<(identifier: string, redirectTo: string) => Promise<boolean>>();

vi.mock('@ValenceClient/session/askForPasswordReset', () => ({
  askForPasswordReset: (identifier: string, redirectTo: string) =>
    askForPasswordReset(identifier, redirectTo),
}));

beforeEach(() => {
  askForPasswordReset.mockReset().mockResolvedValue(true);
});

describe('ForgotPassword', () => {
  it('asks for a link by username, back to the reset page, and says where it goes', async () => {
    render(<ForgotPassword />);

    await userEvent.click(screen.getByRole('button', { name: 'Forgot your password?' }));
    await userEvent.type(screen.getByLabelText('Username or email'), ' ada ');
    await userEvent.click(screen.getByRole('button', { name: 'Send me a link' }));

    expect(
      await screen.findByText(/a link to choose a new password is on its way/),
    ).toBeInTheDocument();
    expect(askForPasswordReset).toHaveBeenCalledWith(
      'ada',
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
    await userEvent.click(screen.getByRole('button', { name: 'Send me a link' }));

    expect(await screen.findByText('That could not be done.')).toBeInTheDocument();
  });
});
