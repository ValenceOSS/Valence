import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMountArrival } from './useMountArrival';

describe('useMountArrival', () => {
  it('brings a block in from hidden to shown', () => {
    const { result } = renderHook(() => useMountArrival());

    expect(result.current()).toMatchObject({ initial: 'hidden', animate: 'shown' });
  });

  it('puts blocks mounted together one behind another', () => {
    const { result: first } = renderHook(() => useMountArrival());
    const { result: second } = renderHook(() => useMountArrival());

    expect(Number(second.current().custom)).toBeGreaterThan(Number(first.current().custom));
  });

  it('gives each piece of a block its own place, in order', () => {
    const { result } = renderHook(() => useMountArrival(3));
    const first = Number(result.current(0).custom);

    expect(Number(result.current(2).custom)).toBe(first + 2);
  });

  it('keeps its place across drawings, so a block redrawn does not jump the line', () => {
    const { result, rerender } = renderHook(() => useMountArrival());
    const before = Number(result.current().custom);

    rerender();

    expect(Number(result.current().custom)).toBe(before);
  });
});
