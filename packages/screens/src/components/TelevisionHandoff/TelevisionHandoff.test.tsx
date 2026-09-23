import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TelevisionHandoff } from './TelevisionHandoff';

const startDeviceGrant = vi.hoisted(() => vi.fn());
const askWhetherTheDeviceMayIn = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/session/auth', () => ({ startDeviceGrant, askWhetherTheDeviceMayIn }));

const GRANT = {
  deviceCode: 'the-long-secret-one',
  userCode: 'ABCD1234',
  verificationUri: 'http://valence.local:8420/device',
  verificationUriComplete: 'http://valence.local:8420/device?user_code=ABCD1234',
  intervalSeconds: 0,
  expiresInSeconds: 600,
};

const tick = async (milliseconds: number): Promise<void> => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
};

beforeEach(() => {
  startDeviceGrant.mockReset().mockResolvedValue(GRANT);
  askWhetherTheDeviceMayIn.mockReset().mockResolvedValue({ kind: 'waiting' });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('signing a television in from a phone', () => {
  it('shows the code somebody has to type', async () => {
    render(<TelevisionHandoff name="Valence" onSignedIn={vi.fn()} />);

    expect(await screen.findByText('ABCD1234')).toBeInTheDocument();
  });

  it('sends the phone to the address this screen reached Valence on', async () => {
    render(<TelevisionHandoff name="Valence" onSignedIn={vi.fn()} />);

    await screen.findByText('ABCD1234');

    expect(screen.getByText(`${window.location.host}/device`)).toBeInTheDocument();
    expect(screen.queryByText('valence.local:8420/device')).not.toBeInTheDocument();
  });

  it('never puts the code it polls with on the screen', async () => {
    render(<TelevisionHandoff name="Valence" onSignedIn={vi.fn()} />);

    await screen.findByText('ABCD1234');

    expect(screen.queryByText(/the-long-secret-one/)).not.toBeInTheDocument();
  });

  it('asks with the long code and not the one on screen', async () => {
    render(<TelevisionHandoff name="Valence" onSignedIn={vi.fn()} />);

    await waitFor(() => {
      expect(askWhetherTheDeviceMayIn).toHaveBeenCalledWith('the-long-secret-one');
    });
  });

  it('lets the television in once the phone has said yes', async () => {
    const onSignedIn = vi.fn();

    askWhetherTheDeviceMayIn.mockResolvedValue({ kind: 'signedIn', token: 'a-session-token' });

    render(<TelevisionHandoff name="Valence" onSignedIn={onSignedIn} />);

    await waitFor(() => {
      expect(onSignedIn).toHaveBeenCalled();
    });
  });

  it('says so, and offers another code, when the one on screen ran out', async () => {
    askWhetherTheDeviceMayIn.mockResolvedValue({ kind: 'expired' });

    render(<TelevisionHandoff name="Valence" onSignedIn={vi.fn()} />);

    expect(await screen.findByText('That code ran out. Ask for another one.')).toBeInTheDocument();
  });

  it('says plainly when somebody turned it down on the other device', async () => {
    askWhetherTheDeviceMayIn.mockResolvedValue({ kind: 'refused' });

    render(<TelevisionHandoff name="Valence" onSignedIn={vi.fn()} />);

    expect(
      await screen.findByText('That was turned down on the other device.'),
    ).toBeInTheDocument();
  });

  it('asks for a fresh code rather than reusing the spent one', async () => {
    askWhetherTheDeviceMayIn.mockResolvedValue({ kind: 'expired' });

    render(<TelevisionHandoff name="Valence" onSignedIn={vi.fn()} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Ask for another code' }));

    await waitFor(() => {
      expect(startDeviceGrant).toHaveBeenCalledTimes(2);
    });
  });

  it('says the server could not be reached rather than showing an empty screen', async () => {
    startDeviceGrant.mockResolvedValue(null);

    render(<TelevisionHandoff name="Valence" onSignedIn={vi.fn()} />);

    expect(await screen.findByText('Valence could not be reached.')).toBeInTheDocument();
  });

  it('waits the interval the server named before asking at all', async () => {
    vi.useFakeTimers();
    startDeviceGrant.mockResolvedValue({ ...GRANT, intervalSeconds: 5 });

    render(<TelevisionHandoff name="Valence" onSignedIn={vi.fn()} />);

    await tick(0);

    expect(askWhetherTheDeviceMayIn).not.toHaveBeenCalled();

    await tick(4999);

    expect(askWhetherTheDeviceMayIn).not.toHaveBeenCalled();

    await tick(1);

    expect(askWhetherTheDeviceMayIn).toHaveBeenCalledTimes(1);
  });

  it('obeys a server that says to slow down, rather than asking at the same rate', async () => {
    vi.useFakeTimers();
    startDeviceGrant.mockResolvedValue({ ...GRANT, intervalSeconds: 5 });
    askWhetherTheDeviceMayIn.mockResolvedValue({ kind: 'slowDown' });

    render(<TelevisionHandoff name="Valence" onSignedIn={vi.fn()} />);

    await tick(0);
    await tick(5000);

    expect(askWhetherTheDeviceMayIn).toHaveBeenCalledTimes(1);

    await tick(5000);

    expect(askWhetherTheDeviceMayIn).toHaveBeenCalledTimes(1);

    await tick(5000);

    expect(askWhetherTheDeviceMayIn).toHaveBeenCalledTimes(2);
  });

  it('stops asking once it has been let in, rather than polling a spent code', async () => {
    vi.useFakeTimers();
    startDeviceGrant.mockResolvedValue({ ...GRANT, intervalSeconds: 5 });
    askWhetherTheDeviceMayIn.mockResolvedValue({ kind: 'signedIn', token: 'a-session-token' });

    render(<TelevisionHandoff name="Valence" onSignedIn={vi.fn()} />);

    await tick(0);
    await tick(30000);

    expect(askWhetherTheDeviceMayIn).toHaveBeenCalledTimes(1);
  });
});
