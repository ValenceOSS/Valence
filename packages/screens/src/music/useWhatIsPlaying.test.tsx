import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderHookInAnAddress } from '@ValenceScreens/testing/renderHookInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { useWhatIsPlaying } from './useWhatIsPlaying';

const devices = vi.hoisted(() => ({ fetchMusicDevices: vi.fn() }));

vi.mock('@ValenceClient/music/musicDevices', () => devices);

describe('useWhatIsPlaying', () => {
  it('shows nothing where nothing is playing', () => {
    const { result } = renderHookInAnAddress(() =>
      useWhatIsPlaying(aFakeMusicPlayer().player.read()),
    );

    expect(result.current).toBeNull();
  });

  it('shows the song this device is playing', () => {
    const state = aFakeMusicPlayer({
      current: aTrack(1),
      isPlaying: true,
      positionSeconds: 30,
    }).player.read();

    const { result } = renderHookInAnAddress(() => useWhatIsPlaying(state));

    expect(result.current).toMatchObject({
      title: 'Track 1',
      positionSeconds: 30,
      isPlaying: true,
      remote: null,
    });
  });

  it('shows what another device says it is playing, moved on by the time since', async () => {
    devices.fetchMusicDevices.mockResolvedValue([
      {
        clientId: 'phone',
        label: 'iPhone',
        nowPlaying: {
          trackId: aTrack(2).id,
          title: 'Track 2',
          artists: ['Sleep Token'],
          albumId: aTrack(2).album.id,
          hasArtwork: true,
          positionSeconds: 10,
          durationSeconds: 300,
          isPlaying: true,
          volume: 0.5,
          reportedAtMs: 1000,
        },
      },
    ]);

    const state = aFakeMusicPlayer({
      current: aTrack(1),
      remote: { clientId: 'phone', label: 'iPhone' },
    }).player.read();

    const { result } = renderHookInAnAddress(() => useWhatIsPlaying(state, () => 6000));

    await waitFor(() => {
      expect(result.current).toMatchObject({
        title: 'Track 2',
        positionSeconds: 15,
        isPlaying: true,
        remote: { clientId: 'phone', label: 'iPhone' },
      });
    });
  });
});
