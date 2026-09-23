import { createElement as mockCreateElement } from 'react';
import { Text as mockText } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { askWhetherTheDeviceMayIn, startDeviceGrant } from '@ValenceClient/session/auth';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { holdTheSession } from '@ValenceTv/session/holdTheSession';
import { PhoneSignIn } from '@ValenceTv/components/PhoneSignIn/PhoneSignIn';
import type { DeviceGrant } from '@ValenceClient/session/auth';

jest.mock('@ValenceClient/session/auth', () => ({
  startDeviceGrant: jest.fn(),
  askWhetherTheDeviceMayIn: jest.fn(),
}));

jest.mock('@ValenceTv/components/QrCode/QrCode', () => ({
  QrCode: ({ value, label }: { value: string; label: string }) =>
    mockCreateElement(mockText, { accessibilityLabel: label }, value),
}));

jest.mock('@ValenceTv/session/holdTheSession', () => ({
  holdTheSession: jest.fn(() => Promise.resolve(true)),
}));

const GRANT: DeviceGrant = {
  deviceCode: 'device-code',
  userCode: 'WDJB-MJHT',
  verificationUri: 'http://localhost:8420/device',
  verificationUriComplete: 'http://localhost:8420/device?user_code=WDJB-MJHT',
  intervalSeconds: 0,
  expiresInSeconds: 600,
};

beforeEach(() => {
  jest.mocked(startDeviceGrant).mockReset();
  jest.mocked(askWhetherTheDeviceMayIn).mockReset();
  jest.mocked(holdTheSession).mockClear();
  jest.mocked(startDeviceGrant).mockResolvedValue(GRANT);
  jest.mocked(askWhetherTheDeviceMayIn).mockReturnValue(new Promise(() => undefined));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('PhoneSignIn', () => {
  it('shows a code to scan and where to type it, on the server this television reached', async () => {
    rememberServerAddress('http://192.168.1.10:8420');

    const drawn = await render(<PhoneSignIn onSignedIn={jest.fn()} />);

    expect(await drawn.findByText('WDJB-MJHT')).toBeTruthy();
    expect(drawn.getByText('192.168.1.10:8420/device')).toBeTruthy();
    expect(drawn.getByLabelText("A code to scan with your phone's camera")).toBeTruthy();
  });

  it('puts only the address in the code to scan, never the code to enter', async () => {
    rememberServerAddress('http://192.168.1.10:8420');

    const drawn = await render(<PhoneSignIn onSignedIn={jest.fn()} />);

    expect(
      await drawn.findByLabelText("A code to scan with your phone's camera"),
    ).toHaveTextContent('http://192.168.1.10:8420/device');
  });

  it('lets this television in once the phone approves it', async () => {
    jest
      .mocked(askWhetherTheDeviceMayIn)
      .mockResolvedValueOnce({ kind: 'waiting' })
      .mockResolvedValueOnce({ kind: 'signedIn', token: 'the-token' });
    const onSignedIn = jest.fn();

    await render(<PhoneSignIn onSignedIn={onSignedIn} />);

    await waitFor(() => {
      expect(onSignedIn).toHaveBeenCalledTimes(1);
    });
    expect(askWhetherTheDeviceMayIn).toHaveBeenCalledWith('device-code');
    expect(holdTheSession).toHaveBeenCalledWith('the-token');
  });

  it('says the phone said no and starts again with a new code', async () => {
    jest.mocked(askWhetherTheDeviceMayIn).mockResolvedValueOnce({ kind: 'refused' });

    const drawn = await render(<PhoneSignIn onSignedIn={jest.fn()} />);

    expect(await drawn.findByText('That phone said no.')).toBeTruthy();
    await waitFor(() => {
      expect(startDeviceGrant).toHaveBeenCalledTimes(2);
    });
  });

  it('says a code that ran out has been replaced', async () => {
    jest.mocked(askWhetherTheDeviceMayIn).mockResolvedValueOnce({ kind: 'expired' });

    const drawn = await render(<PhoneSignIn onSignedIn={jest.fn()} />);

    expect(await drawn.findByText('That code ran out. Here is a new one.')).toBeTruthy();
  });

  it('says why asking failed', async () => {
    jest
      .mocked(askWhetherTheDeviceMayIn)
      .mockResolvedValueOnce({ kind: 'failed', reason: 'Valence could not be reached.' });

    const drawn = await render(<PhoneSignIn onSignedIn={jest.fn()} />);

    expect(await drawn.findByText('Valence could not be reached.')).toBeTruthy();
  });

  it('says so when the server will not start a sign-in', async () => {
    jest.mocked(startDeviceGrant).mockResolvedValue(null);

    const drawn = await render(<PhoneSignIn onSignedIn={jest.fn()} />);

    expect(await drawn.findByText('This Valence would not start a sign-in.')).toBeTruthy();
    expect(askWhetherTheDeviceMayIn).not.toHaveBeenCalled();
  });

  it('asks less often when told to slow down', async () => {
    jest.useFakeTimers();
    jest.mocked(startDeviceGrant).mockResolvedValue({ ...GRANT, intervalSeconds: 1 });
    jest.mocked(askWhetherTheDeviceMayIn).mockResolvedValue({ kind: 'slowDown' });

    await render(<PhoneSignIn onSignedIn={jest.fn()} />);

    await jest.advanceTimersByTimeAsync(1000);

    expect(askWhetherTheDeviceMayIn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(5000);

    expect(askWhetherTheDeviceMayIn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1000);

    expect(askWhetherTheDeviceMayIn).toHaveBeenCalledTimes(2);
  });
});
