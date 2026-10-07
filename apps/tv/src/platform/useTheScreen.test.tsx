import { renderHook } from '@testing-library/react-native';
import { useWindowDimensions } from 'react-native';
import { useTheScreen } from '@ValenceTv/platform/useTheScreen';

describe('useTheScreen', () => {
  it('is the television’s own screen', async () => {
    const { result } = await renderHook(() => useTheScreen());
    const { result: window } = await renderHook(() => useWindowDimensions());

    expect(result.current).toEqual({ width: window.current.width, height: window.current.height });
  });
});
