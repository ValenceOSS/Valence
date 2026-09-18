import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setMusicLights, useMusicLights } from './musicLights';

afterEach(() => {
  setMusicLights([]);
});

describe('musicLights', () => {
  it('leaves the room unlit to begin with', () => {
    const { result } = renderHook(() => useMusicLights());

    expect(result.current).toEqual([]);
  });

  it('lights the room wherever it is read', () => {
    const lights = [{ color: 'rgb(120 20 20)', at: '10% 10%' }];
    const { result } = renderHook(() => useMusicLights());

    act(() => {
      setMusicLights(lights);
    });

    expect(result.current).toBe(lights);
  });
});
