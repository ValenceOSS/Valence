import { AccessibilityInfo, Animated } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useMarquee } from './useMarquee';

const timesInJavaScript = Animated.timing;

/**
 * How far along the line has slid now.
 */
const placeOf = (along: Animated.Value): number => Number(JSON.stringify(along));

describe('useMarquee', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    jest
      .spyOn(Animated, 'timing')
      .mockImplementation((value, config) =>
        timesInJavaScript(value, { ...config, useNativeDriver: false }),
      );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('keeps still where the line fits its room', async () => {
    const loop = jest.spyOn(Animated, 'loop');
    const { result } = await renderHook(() => useMarquee());

    await act(() => {
      result.current.onRoom(200);
      result.current.onWanted(120);
    });

    expect(loop).not.toHaveBeenCalled();
    expect(placeOf(result.current.along)).toBe(0);
  });

  it('rests at its start, then slides until its end shows, on the native driver', async () => {
    const timing = jest.spyOn(Animated, 'timing');
    const { result } = await renderHook(() => useMarquee({ pointsASecond: 100 }));

    await act(() => {
      result.current.onRoom(200);
      result.current.onWanted(300);
    });

    expect(timing).toHaveBeenCalledWith(
      result.current.along,
      expect.objectContaining({ toValue: -100, duration: 1000, useNativeDriver: true }),
    );

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(placeOf(result.current.along)).toBe(0);

    await act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(placeOf(result.current.along)).toBeCloseTo(-100, 0);
  });

  it('keeps still for somebody who asked for less motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const loop = jest.spyOn(Animated, 'loop');
    const { result } = await renderHook(() => useMarquee());

    await act(async () => {
      await Promise.resolve();
    });
    await act(() => {
      result.current.onRoom(200);
      result.current.onWanted(400);
    });

    expect(result.current.isStill).toBe(true);
    expect(loop).not.toHaveBeenCalled();
  });

  it('starts again from its start when what it holds changes', async () => {
    const { result, rerender } = await renderHook(
      ({ words }: { words: string }) => useMarquee({ pointsASecond: 100, restartsWith: words }),
      { initialProps: { words: 'One' } },
    );

    await act(() => {
      result.current.onRoom(200);
      result.current.onWanted(300);
    });
    await act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(placeOf(result.current.along)).toBeLessThan(0);

    await rerender({ words: 'Two' });

    expect(placeOf(result.current.along)).toBe(0);
  });
});
