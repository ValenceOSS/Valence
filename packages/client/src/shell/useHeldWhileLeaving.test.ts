import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useHeldWhileLeaving } from './useHeldWhileLeaving';

type Shown = { value: string | null; isPresent: boolean };

/**
 * Starts the hook off with a value and whether what it belongs to is there.
 *
 * @param value - What is shown to begin with.
 * @returns The props to start with.
 */
const starting = (value: string | null): Shown => ({ value, isPresent: true });

describe('useHeldWhileLeaving', () => {
  it('passes a value straight through while what it belongs to is still there', () => {
    const { result } = renderHook(() => useHeldWhileLeaving('overview', true));

    expect(result.current).toBe('overview');
  });

  it('goes on answering with the last value once that thing has gone', () => {
    const { result, rerender } = renderHook(
      ({ value, isPresent }: Shown) => useHeldWhileLeaving(value, isPresent),
      { initialProps: starting('overview') },
    );

    rerender({ value: null, isPresent: false });

    expect(result.current).toBe('overview');
  });

  it('does not hold across a change of subject, so a new one is not shown the old one’s detail', () => {
    const { result, rerender } = renderHook(
      ({ value, isPresent }: Shown) => useHeldWhileLeaving(value, isPresent),
      { initialProps: starting('first') },
    );

    rerender({ value: null, isPresent: true });

    expect(result.current).toBeNull();
  });

  it('holds the newest value it saw, not the first', () => {
    const { result, rerender } = renderHook(
      ({ value, isPresent }: Shown) => useHeldWhileLeaving(value, isPresent),
      { initialProps: starting('first') },
    );

    rerender({ value: 'second', isPresent: true });
    rerender({ value: null, isPresent: false });

    expect(result.current).toBe('second');
  });

  it('answers with nothing where nothing was ever shown', () => {
    const { result } = renderHook(() => useHeldWhileLeaving(null, false));

    expect(result.current).toBeNull();
  });

  it('takes an identity for a caller whose value is a fresh array every render', () => {
    const { result, rerender } = renderHook(
      ({ ids, isPresent }: { ids: string[]; isPresent: boolean }) =>
        useHeldWhileLeaving(ids, isPresent, ids.join(',')),
      { initialProps: { ids: ['a', 'b'], isPresent: true } },
    );

    rerender({ ids: ['a', 'b'], isPresent: false });

    expect(result.current).toEqual(['a', 'b']);
  });

  it('holds the newest list it saw where the identity says the list changed', () => {
    const { result, rerender } = renderHook(
      ({ ids, isPresent }: { ids: string[]; isPresent: boolean }) =>
        useHeldWhileLeaving(ids, isPresent, ids.join(',')),
      { initialProps: { ids: ['a'], isPresent: true } },
    );

    rerender({ ids: ['b', 'c'], isPresent: true });
    rerender({ ids: [], isPresent: false });

    expect(result.current).toEqual(['b', 'c']);
  });
});
