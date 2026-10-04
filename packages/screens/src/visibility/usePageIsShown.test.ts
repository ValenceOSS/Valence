import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePageIsShown } from './usePageIsShown';

/**
 * Makes the page report a visibility, and tells it that it changed.
 *
 * @param state - What the page should report.
 */
const turn = (state: DocumentVisibilityState): void => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
  document.dispatchEvent(new Event('visibilitychange'));
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePageIsShown', () => {
  it('says the page is showing while it is', () => {
    const { result } = renderHook(() => usePageIsShown());

    expect(result.current).toBe(true);
  });

  it('follows the page being hidden and shown again', () => {
    const { result } = renderHook(() => usePageIsShown());

    act(() => {
      turn('hidden');
    });

    expect(result.current).toBe(false);

    act(() => {
      turn('visible');
    });

    expect(result.current).toBe(true);
  });
});
