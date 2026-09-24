import { renderHook } from '@testing-library/react-native';
import { usePinchToFill } from './usePinchToFill';

describe('usePinchToFill', () => {
  it('starts with the picture clear of the cutout, and listens for a pinch', async () => {
    const { result } = await renderHook(() => usePinchToFill());

    expect(result.current.howClose).toBe('safe');
    expect(result.current.pinching.panHandlers).toBeDefined();
  });
});
