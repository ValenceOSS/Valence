import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCurlTurn } from './useCurlTurn';
import type { CurlLeaf } from '@ValenceCore/functions/pageCurl.types';

const LEAF: CurlLeaf = { x: 0, y: 0, width: 200, height: 300, spine: 'left' };

describe('useCurlTurn', () => {
  it('lifts the corner nearest the hold when turning on', () => {
    const { result } = renderHook(() => useCurlTurn());
    const hold = result.current.lift(LEAF, 290, 1);

    expect(hold.heading).toBe(1);
    expect(result.current.x.get()).toBe(hold.corner.x);
    expect(result.current.y.get()).toBe(hold.corner.y);
  });

  it('starts from where the page lies turned when turning back', () => {
    const { result } = renderHook(() => useCurlTurn());
    const hold = result.current.lift(LEAF, 290, -1);

    expect(result.current.x.get()).toBe(hold.away.x);
    expect(result.current.y.get()).toBe(hold.away.y);
  });

  it('follows a pull from the lifted corner', () => {
    const { result } = renderHook(() => useCurlTurn());
    const hold = result.current.lift(LEAF, 290, 1);

    result.current.pull(hold, -40, -10);

    expect(result.current.x.get()).toBeLessThan(hold.corner.x);
  });

  it('carries the corner over and says when it lands', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCurlTurn());
    const hold = result.current.lift(LEAF, 290, 1);
    const onDone = vi.fn();

    result.current.carry(hold, true, onDone);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(onDone).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('drops a turn that was stopped before it landed', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCurlTurn());
    const hold = result.current.lift(LEAF, 290, 1);
    const onDone = vi.fn();

    result.current.sweep(hold, 0.3, onDone);
    result.current.stop();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(onDone).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('keeps the same ways of moving the corner from one render to the next', () => {
    const { result, rerender } = renderHook(() => useCurlTurn());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
