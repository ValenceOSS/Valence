import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnchoredNow } from './useAnchoredNow';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1000);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAnchoredNow', () => {
  it('starts at the present, and stays there while nothing changes', () => {
    const { result, rerender } = renderHook(({ question }) => useAnchoredNow(question), {
      initialProps: { question: '1h' },
    });

    vi.setSystemTime(5000);
    rerender({ question: '1h' });

    expect(result.current[0]).toBe(1000);
  });

  it('moves to the present when the question changes', () => {
    const { result, rerender } = renderHook(({ question }) => useAnchoredNow(question), {
      initialProps: { question: '1h' },
    });

    vi.setSystemTime(5000);
    rerender({ question: '7d' });

    expect(result.current[0]).toBe(5000);
  });

  it('moves to the present on request', () => {
    const { result } = renderHook(() => useAnchoredNow('1h'));

    vi.setSystemTime(9000);
    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(9000);
  });
});
