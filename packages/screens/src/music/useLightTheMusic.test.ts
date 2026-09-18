import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setMusicLights, useMusicLights } from './musicLights';
import { useLightTheMusic } from './useLightTheMusic';

const cast = vi.hoisted(() => ({ lights: [{ color: 'rgb(9 9 9)' }] }));

vi.mock('./useArtworkLights', () => ({ useArtworkLights: () => cast.lights }));

afterEach(() => {
  setMusicLights([]);
});

describe('useLightTheMusic', () => {
  it('lights the music section with a picture’s colours', () => {
    const { result } = renderHook(() => {
      useLightTheMusic('/cover.webp');

      return useMusicLights();
    });

    act(() => undefined);

    expect(result.current).toBe(cast.lights);
  });

  it('keeps the room lit while a new picture is still being read', () => {
    const before = [{ color: 'rgb(1 1 1)' }];

    setMusicLights(before);
    cast.lights = [];

    const { result } = renderHook(() => {
      useLightTheMusic('/next.webp');

      return useMusicLights();
    });

    expect(result.current).toBe(before);
    cast.lights = [{ color: 'rgb(9 9 9)' }];
  });
});
