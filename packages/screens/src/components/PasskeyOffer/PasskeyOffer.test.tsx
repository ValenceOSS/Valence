import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PasskeyOffer } from './PasskeyOffer';

type Outcome =
  | { kind: 'registered' }
  | { kind: 'cancelled' }
  | { kind: 'unconfirmed' }
  | { kind: 'failed'; reason: string };

const registerPasskey = vi.hoisted(() =>
  vi.fn<(name: string) => Promise<Outcome>>(() => Promise.resolve({ kind: 'registered' })),
);
const describePasskeyUnavailability = vi.hoisted(() => vi.fn<() => string | null>(() => null));

vi.mock('@ValenceClient/session/auth', () => ({ registerPasskey }));

vi.mock('@ValenceScreens/passkeys/isPasskeySupported', () => ({ describePasskeyUnavailability }));

beforeEach(() => {
  registerPasskey.mockReset().mockResolvedValue({ kind: 'registered' });
  describePasskeyUnavailability.mockReset().mockReturnValue(null);
});

describe('PasskeyOffer', () => {
  it('makes a passkey named after this device and says it is set', async () => {
    const onMade = vi.fn();

    render(<PasskeyOffer onMade={onMade} />);

    expect(screen.queryByLabelText(/Passkey name/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add a passkey' }));

    expect(registerPasskey).toHaveBeenCalledWith('This device');
    expect(
      await screen.findByText('Passkey added. You can sign in with it from now on.'),
    ).toBeVisible();
    expect(onMade).toHaveBeenCalledOnce();
  });

  it('says nothing when the device prompt was cancelled', async () => {
    registerPasskey.mockResolvedValue({ kind: 'cancelled' });
    render(<PasskeyOffer />);

    await userEvent.click(screen.getByRole('button', { name: 'Add a passkey' }));

    expect(screen.getByRole('button', { name: 'Add a passkey' })).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('sends somebody to their account when the sign-in is too old to add one', async () => {
    registerPasskey.mockResolvedValue({ kind: 'unconfirmed' });
    render(<PasskeyOffer />);

    await userEvent.click(screen.getByRole('button', { name: 'Add a passkey' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/You signed in a while ago/);
  });

  it('says why a passkey could not be made', async () => {
    registerPasskey.mockResolvedValue({ kind: 'failed', reason: 'The device said no.' });
    render(<PasskeyOffer />);

    await userEvent.click(screen.getByRole('button', { name: 'Add a passkey' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The device said no.');
  });

  it('says why this device cannot make one instead of offering it', () => {
    describePasskeyUnavailability.mockReturnValue('Passkeys need a secure connection.');
    render(<PasskeyOffer />);

    expect(screen.getByText('Passkeys need a secure connection.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Add a passkey' })).not.toBeInTheDocument();
  });
});
