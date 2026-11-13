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

  it('puts them away at once when hidden, and does not bring them back on the old timer', () => {
    const { result } = renderHook(() => useChromeThatHides());

    act(() => {
      result.current.hide();
    });

    expect(result.current.isShown).toBe(false);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.isShown).toBe(false);
  });

  it('puts showing controls away and brings hidden ones back when toggled', () => {
    const { result } = renderHook(() => useChromeThatHides());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isShown).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isShown).toBe(true);
  });

  it('brings them back for a pointer near the top or the bottom of the screen', () => {
    const { result } = renderHook(() => useChromeThatHides());

    act(() => {
      result.current.hide();
      result.current.follow({ clientY: 10 });
    });

    expect(result.current.isShown).toBe(true);

    act(() => {
      result.current.hide();
      result.current.follow({ clientY: window.innerHeight - 10 });
    });

    expect(result.current.isShown).toBe(true);
  });

  it('only keeps them for a pointer elsewhere, never bringing hidden ones back', () => {
    const { result } = renderHook(() => useChromeThatHides());

    act(() => {
      result.current.hide();
      result.current.follow({ clientY: window.innerHeight / 2 });
    });

    expect(result.current.isShown).toBe(false);

    act(() => {
      result.current.wake();
      vi.advanceTimersByTime(2000);
      result.current.follow({ clientY: window.innerHeight / 2 });
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isShown).toBe(true);
  });
});
