import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTakingTurns } from './useTakingTurns';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTakingTurns', () => {
  it('starts with the first', () => {
    const { result } = renderHook(() => useTakingTurns(3, 1000));

    expect(result.current).toBe(0);
  });

  it('moves on each beat and wraps round to the first again', () => {
    const { result } = renderHook(() => useTakingTurns(3, 1000));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current).toBe(0);
  });

  it('stays on the first where there is nothing, or only one thing, to take turns between', () => {
    const none = renderHook(() => useTakingTurns(0, 1000));
    const one = renderHook(() => useTakingTurns(1, 1000));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(none.result.current).toBe(0);
    expect(one.result.current).toBe(0);
  });

  it('stops counting once there is only one thing left', () => {
    const { result, rerender } = renderHook(({ count }) => useTakingTurns(count, 1000), {
      initialProps: { count: 2 },
    });

    rerender({ count: 1 });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current).toBe(0);
  });
});
