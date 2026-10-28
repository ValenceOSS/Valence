import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLiveWindow } from '@ValenceClient/live/useLiveWindow';

describe('useLiveWindow', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('gives the half hour now, four hours on, and the time, moving on each minute', () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-10-28T20:59:30Z'));

    const hook = renderHook(() => useLiveWindow());

    expect(hook.result.current).toEqual({
      from: Date.parse('2026-10-28T20:30:00Z'),
      until: Date.parse('2026-10-29T00:30:00Z'),
      now: Date.parse('2026-10-28T20:59:30Z'),
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(hook.result.current.from).toBe(Date.parse('2026-10-28T21:00:00Z'));
    expect(hook.result.current.now).toBe(Date.parse('2026-10-28T21:00:30Z'));
  });
});
