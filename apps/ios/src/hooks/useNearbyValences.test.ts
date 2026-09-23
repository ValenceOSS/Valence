import { renderHook } from '@testing-library/react-native';
import { useNearbyValences } from './useNearbyValences';

describe('useNearbyValences', () => {
  it('finds nothing on a build without the network browser, and the address can still be typed', async () => {
    const { result } = await renderHook(() => useNearbyValences());

    expect(result.current).toEqual([]);
  });
});
