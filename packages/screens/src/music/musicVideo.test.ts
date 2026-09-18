import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setMusicVideo, useMusicVideo } from './musicVideo';

afterEach(() => {
  setMusicVideo(null);
});

describe('musicVideo', () => {
  it('shows no video to begin with', () => {
    expect(renderHook(() => useMusicVideo()).result.current).toBeNull();
  });

  it('shows a video wherever it is read, and puts it away again', () => {
    const { result } = renderHook(() => useMusicVideo());

    act(() => {
      setMusicVideo({ title: 'Caramel', videoKey: 'abcdefghijk' });
    });

    expect(result.current).toEqual({ title: 'Caramel', videoKey: 'abcdefghijk' });

    act(() => {
      setMusicVideo(null);
    });

    expect(result.current).toBeNull();
  });
});
