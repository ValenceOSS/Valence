import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { PasskeyStep } from './PasskeyStep';

const hasAPassword = vi.hoisted(() => vi.fn<() => Promise<boolean>>());
const listPasskeys = vi.hoisted(() => vi.fn<() => Promise<{ id: string }[]>>());
const registerPasskey = vi.hoisted(() => vi.fn());
const giveFirstPassword = vi.hoisted(() =>
  vi.fn<(password: string) => Promise<{ message: string } | null>>(),
);

vi.mock('@ValenceClient/session/auth', () => ({
  hasAPassword,
  listPasskeys,
  registerPasskey,
  fetchSession: vi.fn(),
}));
vi.mock('@ValenceClient/setup/giveFirstPassword', () => ({ giveFirstPassword }));
vi.mock('@ValenceScreens/passkeys/isPasskeySupported', () => ({
  describePasskeyUnavailability: () => null,
}));

const PASSWORD = 'a-long-enough-password';

/**
 * Draws the step in a cache of its own.
 *
 * @param onFinish - Told when finishing is pressed.
 */
const drawIt = (onFinish = vi.fn()) => {
  render(
    <CacheScope>
      <PasskeyStep isFinishing={false} onFinish={onFinish} />
    </CacheScope>,
  );
};

beforeEach(() => {
  hasAPassword.mockReset().mockResolvedValue(true);
  listPasskeys.mockReset().mockResolvedValue([]);
  registerPasskey.mockReset().mockResolvedValue({ kind: 'registered' });
  giveFirstPassword.mockReset().mockResolvedValue(null);
});

describe('PasskeyStep', () => {
  it('lets an account with a password finish without a passkey', async () => {
    const onFinish = vi.fn();

    drawIt(onFinish);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Finish' })).toBeEnabled();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));

    expect(onFinish).toHaveBeenCalledOnce();
  });

  it('shows a passkey made while setting up as done, rather than offering another', async () => {
    listPasskeys.mockResolvedValue([{ id: 'passkey-1' }]);

    drawIt();

    expect(
      await screen.findByText('Passkey added. You can sign in with it from now on.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add a passkey' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finish' })).toBeEnabled();
  });

  it('holds an account with no way in until it makes a passkey', async () => {
    hasAPassword.mockResolvedValue(false);

    drawIt();

    expect(
      await screen.findByRole('button', { name: 'Use a password instead' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finish' })).toBeDisabled();

    listPasskeys.mockResolvedValue([{ id: 'passkey-1' }]);
    await userEvent.click(screen.getByRole('button', { name: 'Add a passkey' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Finish' })).toBeEnabled();
    });
  });

  it('lets an account with no way in choose a password instead', async () => {
    hasAPassword.mockResolvedValue(false);

    drawIt();

    await userEvent.click(await screen.findByRole('button', { name: 'Use a password instead' }));
    await userEvent.type(screen.getByLabelText('Password'), PASSWORD);

    hasAPassword.mockResolvedValue(true);
    await userEvent.click(screen.getByRole('button', { name: 'Set a password' }));

    expect(giveFirstPassword).toHaveBeenCalledWith(PASSWORD);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Finish' })).toBeEnabled();
    });
  });

  it('says why the password was refused', async () => {
    hasAPassword.mockResolvedValue(false);
    giveFirstPassword.mockResolvedValue({ message: 'That account already has a password.' });

    drawIt();

    await userEvent.click(await screen.findByRole('button', { name: 'Use a password instead' }));
    await userEvent.type(screen.getByLabelText('Password'), PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Set a password' }));

    expect(await screen.findByText('That account already has a password.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PasskeyStep.displayName).toBe('PasskeyStep');
  });
});
