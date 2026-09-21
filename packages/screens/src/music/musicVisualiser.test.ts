import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setMusicVisualiser, useMusicVisualiser } from './musicVisualiser';

afterEach(() => {
  setMusicVisualiser(false);
});

describe('musicVisualiser', () => {
  it('is closed to begin with', () => {
    expect(renderHook(() => useMusicVisualiser()).result.current).toBe(false);
  });

  it('opens and closes wherever it is read', () => {
    const { result } = renderHook(() => useMusicVisualiser());

    act(() => {
      setMusicVisualiser(true);
    });

    expect(result.current).toBe(true);

    act(() => {
      setMusicVisualiser(false);
    });

    expect(result.current).toBe(false);
  });
});
