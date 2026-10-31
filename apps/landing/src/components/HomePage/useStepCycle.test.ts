import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStepCycle } from './useStepCycle';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useStepCycle', () => {
  it('starts on the first step', () => {
    const { result } = renderHook(() => useStepCycle(3, 6000, true));

    expect(result.current.active).toBe(0);
  });

  it('moves on to the next step once one has stayed its time, and back round to the first', () => {
    const { result } = renderHook(() => useStepCycle(3, 6000, true));

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(result.current.active).toBe(1);

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(result.current.active).toBe(0);
  });

  it('gives each step its full time in turn rather than skipping one', () => {
    const { result } = renderHook(() => useStepCycle(3, 6000, true));

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(result.current.active).toBe(1);
    expect(result.current.progress.get()).toBeLessThan(0.5);

    act(() => {
      vi.advanceTimersByTime(5900);
    });
    expect(result.current.active).toBe(1);
  });

  it('holds still while it is not running', () => {
    const { result } = renderHook(() => useStepCycle(3, 6000, false));

    act(() => {
      vi.advanceTimersByTime(20000);
    });

    expect(result.current.active).toBe(0);
  });

  it('goes straight to a chosen step and gives it its full time', () => {
    const { result } = renderHook(() => useStepCycle(3, 6000, true));

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    act(() => {
      result.current.select(2);
    });
    expect(result.current.active).toBe(2);
    expect(result.current.progress.get()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.active).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.active).toBe(0);
  });
});
