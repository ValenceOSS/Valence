import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useArrivals } from './useArrivals';

describe('useArrivals', () => {
  it('has a card seen for the first time arrive from hidden', () => {
    const { result } = renderHook(() => useArrivals());

    expect(result.current('a').initial).toBe('hidden');
    expect(result.current('a').animate).toBe('shown');
  });

  it('gives the cards of one batch their places in it, in order', () => {
    const { result } = renderHook(() => useArrivals());

    expect(result.current('a').custom).toBe(0);
    expect(result.current('b').custom).toBe(1);
    expect(result.current('c').custom).toBe(2);
  });

  it('keeps a card in its place however often it is asked about', () => {
    const { result } = renderHook(() => useArrivals());

    result.current('a');
    result.current('b');

    expect(result.current('b').custom).toBe(1);
  });

  it('does not replay a card that has already arrived', () => {
    const { result } = renderHook(() => useArrivals());

    const first = result.current('a');

    const done = first.onAnimationComplete;

    if (done !== undefined) {
      done('shown');
    }

    expect(result.current('a').initial).toBe(false);
  });
});
