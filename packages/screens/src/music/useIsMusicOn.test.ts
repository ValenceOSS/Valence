import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { useIsMusicOn } from './useIsMusicOn';

describe('useIsMusicOn', () => {
  it('is off while nothing plays', () => {
    const { result } = renderHook(() => useIsMusicOn(aFakeMusicPlayer().player));

    expect(result.current).toBe(false);
  });

  it('turns on when music starts here, and off when it stops', () => {
    const fake = aFakeMusicPlayer({ current: aTrack(1) });
    const { result } = renderHook(() => useIsMusicOn(fake.player));

    act(() => {
      fake.set({ isPlaying: true });
    });

    expect(result.current).toBe(true);

    act(() => {
      fake.set({ isPlaying: false });
    });

    expect(result.current).toBe(false);
  });

  it('is off while the music plays on another device', () => {
    const fake = aFakeMusicPlayer({
      current: aTrack(1),
      isPlaying: true,
      remote: { clientId: 'phone', label: 'iPhone' },
    });

    const { result } = renderHook(() => useIsMusicOn(fake.player));

    expect(result.current).toBe(false);
  });
});
