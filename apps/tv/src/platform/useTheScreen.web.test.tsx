import { act, renderHook } from '@testing-library/react';
import { useTheScreen } from '@ValenceTv/platform/useTheScreen';

/**
 * Has the window say it is so big.
 *
 * @param width - How wide.
 * @param height - How tall.
 */
const aWindow = (width: number, height: number): void => {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
};

describe('useTheScreen in a browser', () => {
  it('is 1920 points across whatever the window, and follows its shape', () => {
    aWindow(960, 540);

    const { result } = renderHook(() => useTheScreen());

    expect(result.current).toEqual({ width: 1920, height: 1080 });

    aWindow(960, 600);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toEqual({ width: 1920, height: 1200 });
  });
});
