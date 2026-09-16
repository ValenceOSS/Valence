import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CapturingIntersectionObserver,
  entryFor,
} from '@ValenceLanding/testing/CapturingIntersectionObserver';
import { useActiveSection } from './useActiveSection';

afterEach(() => {
  vi.unstubAllGlobals();
  CapturingIntersectionObserver.latest = null;
});

describe('useActiveSection', () => {
  it('names the first id before anything has been measured', () => {
    const { result } = renderHook(() => useActiveSection(['a', 'b']));

    expect(result.current).toBe('a');
  });

  it('names nothing when there are no ids to watch', () => {
    const { result } = renderHook(() => useActiveSection([]));

    expect(result.current).toBeNull();
  });

  it('observes only the ids that actually exist on the page', () => {
    vi.stubGlobal('IntersectionObserver', CapturingIntersectionObserver);

    const a = document.createElement('div');
    a.id = 'a';
    document.body.append(a);

    renderHook(() => useActiveSection(['a', 'missing']));

    expect(CapturingIntersectionObserver.latest?.observed).toEqual([a]);

    a.remove();
  });

  it('moves to whichever intersecting section is most in view', () => {
    vi.stubGlobal('IntersectionObserver', CapturingIntersectionObserver);

    const { result } = renderHook(() => useActiveSection(['a', 'b', 'c']));
    const observer = CapturingIntersectionObserver.latest;

    act(() => {
      observer?.callback(
        [entryFor('a', true, 0.2), entryFor('b', true, 0.9), entryFor('c', false, 1)],
        observer,
      );
    });

    expect(result.current).toBe('b');
  });

  it('holds its place when nothing is currently intersecting', () => {
    vi.stubGlobal('IntersectionObserver', CapturingIntersectionObserver);

    const { result } = renderHook(() => useActiveSection(['a', 'b']));
    const observer = CapturingIntersectionObserver.latest;

    act(() => {
      observer?.callback([entryFor('a', false, 0), entryFor('b', false, 0)], observer);
    });

    expect(result.current).toBe('a');
  });

  it('disconnects the observer once nothing needs it any more', () => {
    vi.stubGlobal('IntersectionObserver', CapturingIntersectionObserver);

    const { unmount } = renderHook(() => useActiveSection(['a']));
    const observer = CapturingIntersectionObserver.latest;

    unmount();

    expect(observer?.isDisconnected).toBe(true);
  });
});
