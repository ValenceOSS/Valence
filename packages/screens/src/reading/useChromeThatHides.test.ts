import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChromeThatHides } from './useChromeThatHides';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useChromeThatHides', () => {
  it('shows the controls on arrival', () => {
    const { result } = renderHook(() => useChromeThatHides());

    expect(result.current.isShown).toBe(true);
  });

  it('hides them once they have been left alone', () => {
    const { result } = renderHook(() => useChromeThatHides());

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.isShown).toBe(false);
  });

  it('shows them again when woken, and keeps them while somebody is busy', () => {
    const { result } = renderHook(() => useChromeThatHides());

    act(() => {
      vi.advanceTimersByTime(3000);
      result.current.wake();
    });

    expect(result.current.isShown).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
      result.current.wake();
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isShown).toBe(true);
  });

  it('does not bring hidden controls back when only kept', () => {
    const { result } = renderHook(() => useChromeThatHides());

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    act(() => {
      result.current.keep();
    });

    expect(result.current.isShown).toBe(false);
  });

  it('keeps showing controls a moment longer when kept', () => {
    const { result } = renderHook(() => useChromeThatHides());

    act(() => {
      vi.advanceTimersByTime(2000);
      result.current.keep();
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isShown).toBe(true);
  });
});
