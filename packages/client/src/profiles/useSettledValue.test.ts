import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSettledValue } from './useSettledValue';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useSettledValue', () => {
  it('keeps the value it last held still at until a new one has held still a moment', () => {
    const { result, rerender } = renderHook(({ value }) => useSettledValue(value, 250), {
      initialProps: { value: '#ff0000' },
    });

    rerender({ value: '#00ff00' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: '#0000ff' });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe('#ff0000');

    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(result.current).toBe('#0000ff');
  });
});
