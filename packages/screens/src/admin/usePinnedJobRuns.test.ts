import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePinnedJobRuns } from './usePinnedJobRuns';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('usePinnedJobRuns', () => {
  it('has nothing pinned to begin with', () => {
    expect(renderHook(() => usePinnedJobRuns()).result.current.pinned.size).toBe(0);
  });

  it('hands back the same set until something is pinned, so what is built from it holds', () => {
    const { result, rerender } = renderHook(() => usePinnedJobRuns());
    const before = result.current.pinned;

    rerender();

    expect(result.current.pinned).toBe(before);

    act(() => {
      result.current.toggle('run-1');
    });

    expect(result.current.pinned).not.toBe(before);
  });

  it('pins a run, and unpins it when it is toggled again', () => {
    const { result } = renderHook(() => usePinnedJobRuns());

    act(() => {
      result.current.toggle('run-1');
    });

    expect(result.current.pinned.has('run-1')).toBe(true);

    act(() => {
      result.current.toggle('run-1');
    });

    expect(result.current.pinned.has('run-1')).toBe(false);
  });

  it('is still pinned the next time the page is opened', () => {
    const first = renderHook(() => usePinnedJobRuns());

    act(() => {
      first.result.current.toggle('run-1');
    });

    expect(renderHook(() => usePinnedJobRuns()).result.current.pinned.has('run-1')).toBe(true);
  });

  it('keeps only the twenty most recent', () => {
    const { result } = renderHook(() => usePinnedJobRuns());

    for (let at = 0; at < 25; at += 1) {
      act(() => {
        result.current.toggle(`run-${at.toString()}`);
      });
    }

    expect(result.current.pinned.size).toBe(20);
    expect(result.current.pinned.has('run-0')).toBe(false);
    expect(result.current.pinned.has('run-24')).toBe(true);
  });

  it('starts with nothing where what was kept cannot be read', () => {
    window.localStorage.setItem('valence.pinnedJobRuns', '{not json');

    expect(renderHook(() => usePinnedJobRuns()).result.current.pinned.size).toBe(0);

    window.localStorage.setItem('valence.pinnedJobRuns', '{"a":1}');

    expect(renderHook(() => usePinnedJobRuns()).result.current.pinned.size).toBe(0);
  });

  it('starts with nothing where what was kept is not a list of text', () => {
    window.localStorage.setItem('valence.pinnedJobRuns', '["run-1", 7, null]');

    expect(renderHook(() => usePinnedJobRuns()).result.current.pinned.size).toBe(0);
  });

  it('still works where storage will not answer', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(() => usePinnedJobRuns());

    act(() => {
      result.current.toggle('run-1');
    });

    expect(result.current.pinned.has('run-1')).toBe(true);
  });
});
