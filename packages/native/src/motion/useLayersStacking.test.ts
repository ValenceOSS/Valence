import { AccessibilityInfo, Animated } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useLayersStacking } from './useLayersStacking';

const springsInJavaScript = Animated.spring;

const timesInJavaScript = Animated.timing;

/**
 * Where each layer is now, base first.
 */
const placesOf = (layers: readonly Animated.Value[]): number[] =>
  layers.map((layer) => Number(JSON.stringify(layer)));

describe('useLayersStacking', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    jest
      .spyOn(Animated, 'spring')
      .mockImplementation((value, config) =>
        springsInJavaScript(value, { ...config, useNativeDriver: false }),
      );
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

  it('is stacked at once where it neither arrives nor loops', async () => {
    const { result } = await renderHook(() => useLayersStacking({}));

    expect(placesOf(result.current)).toEqual([1, 1, 1]);
  });

  it('arrives lifted away and drops every layer into place', async () => {
    const { result } = await renderHook(() => useLayersStacking({ arrives: true }));

    expect(placesOf(result.current)).toEqual([0, 0, 0]);

    await act(() => {
      jest.advanceTimersByTime(3000);
    });

    placesOf(result.current).forEach((place) => {
      expect(place).toBeCloseTo(1, 1);
    });
  });

  it('lifts the top layer away first while it loops', async () => {
    const { result } = await renderHook(() => useLayersStacking({ loops: true }));
    let liftedFirst: number | null = null;

    for (let waited = 0; waited < 4000 && liftedFirst === null; waited += 50) {
      await act(() => {
        jest.advanceTimersByTime(50);
      });

      const places = placesOf(result.current);

      if (waited > 1000 && places.some((place) => place < 0.5)) {
        liftedFirst = places.findIndex((place) => place < 0.5);
      }
    }

    expect(liftedFirst).toBe(2);
  });

  it('settles every layer into place once it stops looping', async () => {
    const { result, rerender } = await renderHook(
      ({ loops }: { loops: boolean }) => useLayersStacking({ loops }),
      { initialProps: { loops: true } },
    );

    await act(() => {
      jest.advanceTimersByTime(2600);
    });
    await rerender({ loops: false });
    await act(() => {
      jest.advanceTimersByTime(3000);
    });

    placesOf(result.current).forEach((place) => {
      expect(place).toBeCloseTo(1, 1);
    });
  });
});
