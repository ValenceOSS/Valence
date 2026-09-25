import { act, renderHook, waitFor } from '@testing-library/react-native';
import { addNetworkStateListener, getNetworkStateAsync, NetworkStateType } from 'expo-network';
import { useIsOnMobileData } from './useIsOnMobileData';
import type { NetworkState } from 'expo-network';

jest.mock('expo-network', () => ({
  NetworkStateType: { CELLULAR: 'CELLULAR', WIFI: 'WIFI' },
  getNetworkStateAsync: jest.fn(),
  addNetworkStateListener: jest.fn(),
}));

let told: (state: NetworkState) => void = () => undefined;

beforeEach(() => {
  jest.mocked(addNetworkStateListener).mockImplementation((listener) => {
    told = listener;

    return { remove: () => undefined };
  });
});

describe('useIsOnMobileData', () => {
  it('says so on mobile data', async () => {
    jest
      .mocked(getNetworkStateAsync)
      .mockResolvedValue({ isConnected: true, type: NetworkStateType.CELLULAR });

    const { result } = await renderHook(() => useIsOnMobileData());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('follows the phone onto Wi-Fi', async () => {
    jest
      .mocked(getNetworkStateAsync)
      .mockResolvedValue({ isConnected: true, type: NetworkStateType.CELLULAR });

    const { result } = await renderHook(() => useIsOnMobileData());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    await act(() => {
      told({ isConnected: true, type: NetworkStateType.WIFI });
    });

    expect(result.current).toBe(false);
  });
});
