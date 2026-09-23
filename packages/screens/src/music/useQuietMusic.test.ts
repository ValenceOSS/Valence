import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { useQuietMusic } from './useQuietMusic';

describe('useQuietMusic', () => {
  it('pauses music playing on this device', () => {
    const { player } = aFakeMusicPlayer({ current: aTrack(1), isPlaying: true });

    renderHook(() => {
      useQuietMusic(player);
    });

    expect(player.pause).toHaveBeenCalled();
  });

  it('leaves music on another device alone', () => {
    const { player } = aFakeMusicPlayer({
      current: aTrack(1),
      isPlaying: true,
      remote: { clientId: 'phone', label: 'iPhone' },
    });

    renderHook(() => {
      useQuietMusic(player);
    });

    expect(player.pause).not.toHaveBeenCalled();
  });

  it('does nothing where nothing is playing', () => {
    const { player } = aFakeMusicPlayer();

    renderHook(() => {
      useQuietMusic(player);
    });

    expect(player.pause).not.toHaveBeenCalled();
  });
});
