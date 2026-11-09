import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aSessionPlayback } from '@ValenceScreens/testing/aSessionPlayback';
import { useRunningPosition } from './useRunningPosition';

const HEARD_AT = 100_000;

const reported = (changes: { isPlaying?: boolean; reportedAtMs?: number } = {}) =>
  aSessionPlayback({
    isPlaying: changes.isPlaying ?? true,
    health: {
      positionSeconds: 600,
      durationSeconds: 7200,
      bufferedAheadSeconds: 30,
      presentedWidth: 1920,
      presentedHeight: 1080,
      ...(changes.reportedAtMs === undefined ? {} : { reportedAtMs: changes.reportedAtMs }),
    },
  });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(HEARD_AT);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useRunningPosition', () => {
  it('moves a playing film on each second from where its player last said', () => {
    const { result } = renderHook(() => useRunningPosition(reported({ reportedAtMs: HEARD_AT })));

    act(() => {
      vi.advanceTimersByTime(12_000);
    });

    expect(result.current).toBe(612);
  });

  it('holds a paused film where its player said', () => {
    const { result } = renderHook(() =>
      useRunningPosition(reported({ isPlaying: false, reportedAtMs: HEARD_AT })),
    );

    act(() => {
      vi.advanceTimersByTime(12_000);
    });

    expect(result.current).toBe(600);
  });

  it('stops a minute past the last thing it heard, rather than running on for a quiet player', () => {
    const { result } = renderHook(() => useRunningPosition(reported({ reportedAtMs: HEARD_AT })));

    act(() => {
      vi.advanceTimersByTime(300_000);
    });

    expect(result.current).toBe(660);
  });

  it('holds still where an older server does not say when it heard', () => {
    const { result } = renderHook(() => useRunningPosition(reported()));

    act(() => {
      vi.advanceTimersByTime(12_000);
    });

    expect(result.current).toBe(600);
  });

  it('says nothing before the player has said anything', () => {
    const { result } = renderHook(() => useRunningPosition(aSessionPlayback({ health: null })));

    expect(result.current).toBeNull();
  });

  it('says nothing where nothing is playing', () => {
    const { result } = renderHook(() => useRunningPosition(null));

    expect(result.current).toBeNull();
  });
});
