import { renderHook } from '@testing-library/react-native';
import { useArrivingFrom } from './useArrivingFrom';

describe('useArrivingFrom', () => {
  it('is simply there, where it is not arriving from anywhere', async () => {
    const { result } = await renderHook(() => useArrivingFrom(() => null, false));

    expect(JSON.stringify(result.current.flying.opacity)).toBe('1');
  });

  it('waits unseen until it is placed, where it is arriving', async () => {
    const { result } = await renderHook(() =>
      useArrivingFrom(() => ({ x: 0, y: 0, width: 10, height: 10 }), true),
    );

    expect(JSON.stringify(result.current.flying.opacity)).toBe('0');
  });
});
