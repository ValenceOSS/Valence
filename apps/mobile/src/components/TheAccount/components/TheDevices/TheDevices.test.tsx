import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { act, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { Alert } from 'react-native';
import { endDevice, fetchDevices } from '@ValenceClient/account/fetchDevices';
import { fetchMyPermissions } from '@ValenceClient/session/fetchMyPermissions';
import { TheDevices } from './TheDevices';

jest.mock('@ValenceClient/account/fetchDevices');
jest.mock('@ValenceClient/session/fetchMyPermissions');

const aDevice = (id: string, name: string, isCurrent: boolean) => ({
  id,
  name: sayVerbatim(name),
  address: null,
  signedInAt: '2026-09-20T10:00:00.000Z',
  expiresAt: '2026-10-20T10:00:00.000Z',
  isCurrent,
});

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchMyPermissions).mockResolvedValue({ permissions: [], isAdministrator: false });
});

describe('TheDevices', () => {
  it('lists where this account is signed in, and signs one out once asked', async () => {
    jest
      .mocked(fetchDevices)
      .mockResolvedValue([
        aDevice('here', 'This iPhone', true),
        aDevice('tv', 'Living room', false),
      ]);
    jest.mocked(endDevice).mockResolvedValue(true);
    const asking = jest.spyOn(Alert, 'alert');
    const drawn = await render(<TheDevices />, { wrapper: CacheScope });

    expect(await drawn.findByText('Living room')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Sign out Living room' }));
    await act(() => {
      asking.mock.calls
        .at(-1)?.[2]
        ?.find((button) => button.style === 'destructive')
        ?.onPress?.();
    });

    expect(endDevice).toHaveBeenCalledWith('tv');
  });

  it('lists where a shared demo account is signed in, but signs none of it out', async () => {
    jest
      .mocked(fetchMyPermissions)
      .mockResolvedValue({ permissions: [], isAdministrator: false, isDemo: true });
    jest
      .mocked(fetchDevices)
      .mockResolvedValue([
        aDevice('here', 'This iPhone', true),
        aDevice('tv', 'Living room', false),
      ]);
    const drawn = await render(<TheDevices />, { wrapper: CacheScope });

    expect(await drawn.findByText('Living room')).toBeTruthy();
    await act(() => Promise.resolve());

    expect(drawn.queryByRole('button', { name: 'Sign out Living room' })).toBeNull();
    expect(drawn.queryByText('Sign out everywhere else')).toBeNull();
  });
});
