import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTicking } from './useTicking';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1000);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTicking', () => {
  it('brings the moment up to date every second while something is counting', () => {
    const { result } = renderHook(() => useTicking(true));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current).toBe(4000);
  });

  it('keeps no timer where nothing is counting', () => {
    const { result } = renderHook(() => useTicking(false));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current).toBe(1000);
  });

  it('stops when what was counting stops', () => {
    const { result, rerender } = renderHook(({ on }) => useTicking(on), {
      initialProps: { on: true },
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    rerender({ on: false });
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current).toBe(3000);
  });

  it('follows the interval it is given', () => {
    const { result } = renderHook(() => useTicking(true, 250));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(2000);
  });
});
