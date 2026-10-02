import { Alert } from 'react-native';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { endDevice, endOtherDevices } from '@ValenceClient/account/fetchDevices';
import type { Device } from '@ValenceClient/account/fetchDevices';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { YourDevices } from '@ValenceTv/screens/Account/components/YourDevices/YourDevices';

jest.mock('@ValenceClient/account/fetchDevices', () => ({
  fetchDevices: jest.fn(() => new Promise(() => undefined)),
  endDevice: jest.fn(() => Promise.resolve(true)),
  endOtherDevices: jest.fn(() => Promise.resolve(true)),
}));

const aDevice = (id: string, name: string, isCurrent = false): Device => ({
  id,
  name: sayVerbatim(name),
  address: '192.168.1.20',
  signedInAt: '2026-10-01T18:00:00.000Z',
  expiresAt: '2026-11-01T18:00:00.000Z',
  isCurrent,
});

const aCacheHolding = (devices: Device[]): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  cache.setQueryData(['account', 'devices'], devices);

  return cache;
};

const drawWith = (devices: Device[]) =>
  render(
    <QueryClientProvider client={aCacheHolding(devices)}>
      <YourDevices onFocus={jest.fn()} />
    </QueryClientProvider>,
  );

/**
 * Presses the button an alert offers, by its words.
 *
 * @param text - The button's words.
 */
const pressInTheAlert = (text: string) => {
  const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? [];

  buttons.find((button) => button.text === text)?.onPress?.();
};

beforeEach(() => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  jest.mocked(endDevice).mockClear();
  jest.mocked(endOtherDevices).mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('YourDevices', () => {
  it('names this television as this one, with no way to end it from here', async () => {
    const drawn = await drawWith([aDevice('here', 'Living room TV', true)]);

    expect(drawn.getByText('Living room TV · This television')).toBeTruthy();
    expect(
      drawn.getByText('This television is the only place this account is signed in.'),
    ).toBeTruthy();
    expect(drawn.queryByText('Sign out everywhere else')).toBeNull();
  });

  it('ends another device only once somebody says so', async () => {
    const drawn = await drawWith([
      aDevice('here', 'Living room TV', true),
      aDevice('phone', 'Marques’s iPhone'),
    ]);

    await userEvent.press(drawn.getByText('Sign out Marques’s iPhone'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign out Marques’s iPhone?',
      'Whoever is using it will have to sign in again.',
      expect.any(Array),
    );
    expect(endDevice).not.toHaveBeenCalled();

    pressInTheAlert('Sign out');

    await waitFor(() => {
      expect(endDevice).toHaveBeenCalledWith('phone');
    });
  });

  it('keeps a device signed in when somebody thinks better of it', async () => {
    const drawn = await drawWith([
      aDevice('here', 'Living room TV', true),
      aDevice('phone', 'Marques’s iPhone'),
    ]);

    await userEvent.press(drawn.getByText('Sign out Marques’s iPhone'));
    pressInTheAlert('Keep it');

    expect(endDevice).not.toHaveBeenCalled();
  });

  it('ends every other device at once, once asked', async () => {
    const drawn = await drawWith([
      aDevice('here', 'Living room TV', true),
      aDevice('phone', 'Marques’s iPhone'),
      aDevice('laptop', 'Firefox on a Mac'),
    ]);

    await userEvent.press(drawn.getByText('Sign out everywhere else'));
    pressInTheAlert('Sign them out');

    await waitFor(() => {
      expect(endOtherDevices).toHaveBeenCalled();
    });
  });

  it('draws nothing until the devices are read', async () => {
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const drawn = await render(
      <QueryClientProvider client={cache}>
        <YourDevices onFocus={jest.fn()} />
      </QueryClientProvider>,
    );

    expect(drawn.queryByText('Devices')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(YourDevices.displayName).toBe('YourDevices');
  });
});
