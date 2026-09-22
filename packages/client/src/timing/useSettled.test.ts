import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSettled } from './useSettled';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useSettled', () => {
  it('holds the old value until the new one has stopped changing', () => {
    const { result, rerender } = renderHook(({ value }) => useSettled(value, 250), {
      initialProps: { value: 'du' },
    });

    rerender({ value: 'dun' });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe('du');
  });

  it('takes the new value once it has been still long enough', () => {
    const { result, rerender } = renderHook(({ value }) => useSettled(value, 250), {
      initialProps: { value: 'du' },
    });

    rerender({ value: 'dune' });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current).toBe('dune');
  });
});
