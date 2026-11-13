import { AccessibilityInfo } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useDeckFanning } from './useDeckFanning';

describe('useDeckFanning', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is fanned out and full size at once where it neither arrives nor loops', async () => {
    const { result } = await renderHook(() => useDeckFanning({}));

    expect(result.current).toEqual({ progress: 1, grows: 1 });
  });

  it('arrives stacked and small, then fans out and grows into place', async () => {
    const { result } = await renderHook(() => useDeckFanning({ arrives: true }));

    expect(result.current.progress).toBe(0);
    expect(result.current.grows).toBeCloseTo(0.7);

    await act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.progress).toBeCloseTo(1, 1);
    expect(result.current.grows).toBeCloseTo(1, 1);
  });

  it('gathers the cards back up while it loops, starting fanned where it does not arrive', async () => {
    const { result } = await renderHook(() => useDeckFanning({ loops: true }));

    expect(result.current.progress).toBe(1);

    await act(() => {
      jest.advanceTimersByTime(2200);
    });

    expect(result.current.progress).toBeLessThan(0.5);
  });

  it('fans out and stays once it stops looping', async () => {
    const { result, rerender } = await renderHook(
      ({ loops }: { loops: boolean }) => useDeckFanning({ loops }),
      { initialProps: { loops: true } },
    );

    await act(() => {
      jest.advanceTimersByTime(3200);
    });
    await rerender({ loops: false });
    await act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(result.current.progress).toBeCloseTo(1, 1);
  });
});
