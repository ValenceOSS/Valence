import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { WelcomePage } from './WelcomePage';

const navigate = vi.hoisted(() => vi.fn());
const readSetupLink = vi.hoisted(() => vi.fn());
const redeemSetupLink = vi.hoisted(() => vi.fn());
const giveFirstPassword = vi.hoisted(() => vi.fn());
const registerPasskey = vi.hoisted(() => vi.fn());
const passkeys = vi.hoisted(() => ({ isSupported: false }));

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ token: 'tok' }),
  useNavigate: () => navigate,
}));
vi.mock('@ValenceClient/setup/readSetupLink', () => ({ readSetupLink }));
vi.mock('@ValenceClient/setup/redeemSetupLink', () => ({ redeemSetupLink }));
vi.mock('@ValenceClient/setup/giveFirstPassword', () => ({ giveFirstPassword }));
vi.mock('@ValenceClient/session/auth', () => ({ registerPasskey }));
vi.mock('@ValenceScreens/passkeys/isPasskeySupported', () => ({
  isPasskeySupported: () => passkeys.isSupported,
}));

const PASSWORD = 'a-long-enough-password';

/**
 * Draws the page in a cache of its own.
 */
const drawIt = () => {
  render(
    <CacheScope>
      <WelcomePage name="Valence" />
    </CacheScope>,
  );
};

const DETAILS = {
  name: 'Ada',
  username: 'ada',
  suggestedUsername: 'ada',
  hasEmail: false,
  hasPassword: false,
  expiresAt: '2026-10-09T00:00:00.000Z',
};

beforeEach(() => {
  passkeys.isSupported = false;
  navigate.mockReset().mockResolvedValue(undefined);
  readSetupLink.mockReset().mockResolvedValue(DETAILS);
  redeemSetupLink.mockReset().mockResolvedValue({ kind: 'answered', value: { isSignedIn: true } });
  giveFirstPassword.mockReset().mockResolvedValue(null);
  registerPasskey.mockReset().mockResolvedValue({ kind: 'registered' });
});

describe('WelcomePage', () => {
  it('welcomes them by name and sets up the account with what they choose', async () => {
    drawIt();

    expect(await screen.findByRole('heading', { name: 'Welcome, Ada' })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveValue('ada');

    await userEvent.clear(screen.getByLabelText('Username'));
    await userEvent.type(screen.getByLabelText('Username'), 'countess');
    await userEvent.type(screen.getByLabelText('Email (optional)'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));

    expect(redeemSetupLink).toHaveBeenCalledWith('tok', {
      username: 'countess',
      email: 'ada@example.com',
      password: PASSWORD,
    });
    expect(navigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('will not finish with a password too short', async () => {
    drawIt();

    await userEvent.type(await screen.findByLabelText('Password'), 'short');

    expect(screen.getByRole('button', { name: 'Finish' })).toBeDisabled();
  });

  it('keeps the username of an account already in use, and asks for a new password', async () => {
    readSetupLink.mockResolvedValue({ ...DETAILS, hasEmail: true, hasPassword: true });

    drawIt();

    expect(await screen.findByText('Your username is ada.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Email (optional)')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Password'), PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));

    expect(redeemSetupLink).toHaveBeenCalledWith('tok', { password: PASSWORD });
  });

  it('says a link that no longer works does not', async () => {
    readSetupLink.mockRejectedValue(new Error('404'));

    drawIt();

    expect(await screen.findByRole('alert')).toHaveTextContent('no longer works');
  });

  it('says why it was refused', async () => {
    redeemSetupLink.mockResolvedValue({
      kind: 'refused',
      refusal: { message: 'That username is already in use.' },
    });

    drawIt();

    await userEvent.type(await screen.findByLabelText('Password'), PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('already in use');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sends somebody with a second factor to sign in', async () => {
    redeemSetupLink.mockResolvedValue({ kind: 'answered', value: { isSignedIn: false } });

    drawIt();

    await userEvent.type(await screen.findByLabelText('Password'), PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Your password is set');
  });

  it('makes a passkey instead of a password where the device can', async () => {
    passkeys.isSupported = true;

    drawIt();

    await userEvent.click(await screen.findByRole('button', { name: /Use a passkey instead/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));

    expect(redeemSetupLink).toHaveBeenCalledWith('tok', { username: 'ada' });
    expect(registerPasskey).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('offers a password once the passkey failed, and goes in with it', async () => {
    passkeys.isSupported = true;
    registerPasskey.mockResolvedValue({ kind: 'cancelled' });

    drawIt();

    await userEvent.click(await screen.findByRole('button', { name: /Use a passkey instead/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));

    expect(
      await screen.findByRole('heading', { name: 'Your passkey wasn’t created' }),
    ).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Password'), PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Use this password instead' }));

    expect(giveFirstPassword).toHaveBeenCalledWith(PASSWORD);
    expect(navigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WelcomePage.displayName).toBe('WelcomePage');
  });
});
