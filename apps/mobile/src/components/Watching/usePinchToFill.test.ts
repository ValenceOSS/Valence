import { renderHook } from '@testing-library/react-native';
import { usePinchToFill } from './usePinchToFill';

describe('usePinchToFill', () => {
  it('starts with the whole picture fitted to the screen, and listens for a pinch', async () => {
    const { result } = await renderHook(() => usePinchToFill());

    expect(result.current.howClose).toBe('fit');
    expect(result.current.pinching.panHandlers).toBeDefined();
  });
});
