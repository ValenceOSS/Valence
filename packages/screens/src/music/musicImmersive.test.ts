import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setMusicImmersive, useMusicImmersive } from './musicImmersive';

afterEach(() => {
  setMusicImmersive(false);
});

describe('musicImmersive', () => {
  it('is closed to begin with', () => {
    expect(renderHook(() => useMusicImmersive()).result.current).toBe(false);
  });

  it('opens and closes wherever it is read', () => {
    const { result } = renderHook(() => useMusicImmersive());

    act(() => {
      setMusicImmersive(true);
    });

    expect(result.current).toBe(true);

    act(() => {
      setMusicImmersive(false);
    });

    expect(result.current).toBe(false);
  });
});
