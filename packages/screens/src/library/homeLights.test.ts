import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setHomeLights, useHomeLights } from './homeLights';

afterEach(() => {
  setHomeLights([]);
});

describe('homeLights', () => {
  it('leaves the room unlit to begin with', () => {
    const { result } = renderHook(() => useHomeLights());

    expect(result.current).toEqual([]);
  });

  it('lights the room wherever it is read', () => {
    const lights = [{ color: 'rgb(120 20 20)', at: '10% 10%' }];
    const { result } = renderHook(() => useHomeLights());

    act(() => {
      setHomeLights(lights);
    });

    expect(result.current).toBe(lights);
  });

  it('lets lights the same as the ones lit go by, without anybody reading them again', () => {
    let reads = 0;
    const { result } = renderHook(() => {
      reads += 1;

      return useHomeLights();
    });
    const first = [{ color: 'rgb(120 20 20)', at: '10% 10%', weight: 1 }];

    act(() => {
      setHomeLights(first);
    });

    const afterFirst = reads;

    act(() => {
      setHomeLights([{ color: 'rgb(120 20 20)', at: '10% 10%', weight: 1 }]);
    });

    expect([result.current, reads]).toEqual([first, afterFirst]);
  });

  it('takes lights that differ in any way', () => {
    const { result } = renderHook(() => useHomeLights());
    const moved = [{ color: 'rgb(120 20 20)', at: '50% 10%' }];

    act(() => {
      setHomeLights([{ color: 'rgb(120 20 20)', at: '10% 10%' }]);
    });
    act(() => {
      setHomeLights(moved);
    });

    expect(result.current).toBe(moved);
  });
});
