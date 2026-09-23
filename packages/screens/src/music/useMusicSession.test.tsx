import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMusicSession } from '@ValenceScreens/music/useMusicSession';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aFakeMediaSession } from '@ValenceScreens/testing/aFakeMediaSession';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import type { MusicPlayerState } from '@ValenceScreens/music/createMusicPlayer';

let session = aFakeMediaSession();

beforeEach(() => {
  session = aFakeMediaSession();
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'mediaSession');
});

describe('useMusicSession', () => {
  it('puts the song playing on the system’s controls, and its buttons drive the player', () => {
    const { player } = aFakeMusicPlayer();
    const state: MusicPlayerState = {
      ...player.read(),
      current: aTrack(1),
      isPlaying: true,
    };

    const { rerender, unmount } = renderHook(
      ({ playing }: { playing: MusicPlayerState }) => {
        useMusicSession(playing, player);
      },
      { initialProps: { playing: state } },
    );

    expect(session.metadata).toMatchObject({ title: 'Track 1', artist: 'Sleep Token' });
    expect(session.playbackState).toBe('playing');

    session.press('nexttrack');

    expect(player.next).toHaveBeenCalled();

    rerender({ playing: { ...state, isPlaying: false } });

    expect(session.playbackState).toBe('paused');

    unmount();

    expect(session.metadata).toBeNull();
  });
});
