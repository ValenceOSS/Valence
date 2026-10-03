import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResetPasswordPage } from './ResetPasswordPage';

const useSearch = vi.hoisted(() => vi.fn());
const resetPassword = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({ useSearch }));

vi.mock('@ValenceClient/session/resetPassword', () => ({ resetPassword }));

vi.mock('@ValenceClient/session/askForPasswordReset', () => ({
  askForPasswordReset: () => Promise.resolve(true),
}));

const NEW_PASSWORD = 'a much longer password';

beforeEach(() => {
  useSearch.mockReset().mockReturnValue({ token: 'tok' });
  resetPassword.mockReset().mockResolvedValue({ kind: 'changed' });
});

describe('ResetPasswordPage', () => {
  it('sets the new password with the token, once typed the same twice', async () => {
    render(<ResetPasswordPage name="Valence" />);

    const set = screen.getByRole('button', { name: 'Set password' });

    await userEvent.type(screen.getByLabelText('New password'), NEW_PASSWORD);
    await userEvent.type(screen.getByLabelText('Confirm password'), 'something else');

    expect(set).toBeDisabled();
    expect(screen.getByText('The passwords don’t match.')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Confirm password'));
    await userEvent.type(screen.getByLabelText('Confirm password'), NEW_PASSWORD);
    await userEvent.click(set);

    expect(
      await screen.findByText('Your password has been changed. Sign in with it now.'),
    ).toBeInTheDocument();
    expect(resetPassword).toHaveBeenCalledWith('tok', NEW_PASSWORD);
  });

  it('says why not, and offers another link, when the reset is refused', async () => {
    resetPassword.mockResolvedValue({ kind: 'refused', reason: 'That link has expired.' });
    render(<ResetPasswordPage name="Valence" />);

    await userEvent.type(screen.getByLabelText('New password'), NEW_PASSWORD);
    await userEvent.type(screen.getByLabelText('Confirm password'), NEW_PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Set password' }));

    expect(await screen.findByText('That link has expired.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forgot your password?' })).toBeInTheDocument();
  });

  it('says a link that was turned away on the way in no longer works', () => {
    useSearch.mockReturnValue({ error: 'INVALID_TOKEN' });
    render(<ResetPasswordPage name="Valence" />);

    expect(
      screen.getByText('That link has expired or has already been used. Request a new one.'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  });
});
